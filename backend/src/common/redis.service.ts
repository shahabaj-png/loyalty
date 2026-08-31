import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
    if (redisUrl) {
      this.client = new Redis(redisUrl, { maxRetriesPerRequest: null });
    } else if (process.env.REDISHOST || process.env.REDIS_HOST) {
      this.client = new Redis({
        host: process.env.REDISHOST || process.env.REDIS_HOST,
        port: parseInt(process.env.REDISPORT || process.env.REDIS_PORT || '6379'),
        password: process.env.REDISPASSWORD || process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
      });
    } else {
      this.client = new Redis('redis://127.0.0.1:6379', {
        lazyConnect: true,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
      });
    }

    this.client.on('error', (err) => {
      console.warn('⚠️ Redis Warning:', err.message);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // Basic operations
  async get(key: string): Promise<string | null> { return this.client.get(key); }
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) { await this.client.setex(key, ttlSeconds, value); }
    else { await this.client.set(key, value); }
  }
  async del(key: string): Promise<void> { await this.client.del(key); }
  async incr(key: string): Promise<number> { return this.client.incr(key); }

  // JSON helpers
  async getJson<T>(key: string): Promise<T | null> {
    const val = await this.get(key);
    return val ? JSON.parse(val) : null;
  }
  async setJson(key: string, value: any, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // Sorted sets (for leaderboards)
  async zadd(key: string, score: number, member: string): Promise<void> { await this.client.zadd(key, score, member); }
  async zrevrange(key: string, start: number, stop: number): Promise<string[]> { return this.client.zrevrange(key, start, stop); }
  async zrevrangeWithScores(key: string, start: number, stop: number): Promise<{ member: string; score: number }[]> {
    const result = await this.client.zrevrange(key, start, stop, 'WITHSCORES');
    const entries: { member: string; score: number }[] = [];
    for (let i = 0; i < result.length; i += 2) { entries.push({ member: result[i], score: parseFloat(result[i + 1]) }); }
    return entries;
  }
  async zrank(key: string, member: string): Promise<number | null> { return this.client.zrevrank(key, member); }
  async zscore(key: string, member: string): Promise<number | null> {
    const score = await this.client.zscore(key, member);
    return score ? parseFloat(score) : null;
  }
  async zincrby(key: string, increment: number, member: string): Promise<number> {
    const result = await this.client.zincrby(key, increment, member);
    return parseFloat(result);
  }

  // Rate limiting helper
  async checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<boolean> {
    const current = await this.incr(key);
    if (current === 1) { await this.client.expire(key, windowSeconds); }
    return current <= maxAttempts;
  }
}
