import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;

  constructor() {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
      if (redisUrl) {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
          retryStrategy: () => null,
        });
      } else if (process.env.REDISHOST || process.env.REDIS_HOST) {
        this.client = new Redis({
          host: process.env.REDISHOST || process.env.REDIS_HOST,
          port: parseInt(process.env.REDISPORT || process.env.REDIS_PORT || '6379'),
          password: process.env.REDISPASSWORD || process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
          retryStrategy: () => null,
        });
      } else {
        this.client = new Redis('redis://127.0.0.1:6379', {
          lazyConnect: true,
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
          retryStrategy: () => null,
        });
      }

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      this.client.on('error', (err) => {
        console.warn('⚠️ Redis Warning:', err.message);
      });
    } catch (err: any) {
      console.warn('⚠️ Redis init notice:', err.message);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    try { return this.client ? await this.client.get(key) : null; } catch { return null; }
  }
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (!this.client) return;
      if (ttlSeconds) { await this.client.setex(key, ttlSeconds, value); }
      else { await this.client.set(key, value); }
    } catch {}
  }
  async del(key: string): Promise<void> {
    try { if (this.client) await this.client.del(key); } catch {}
  }
  async incr(key: string): Promise<number> {
    try { return this.client ? await this.client.incr(key) : 1; } catch { return 1; }
  }

  // JSON helpers
  async getJson<T>(key: string): Promise<T | null> {
    const val = await this.get(key);
    return val ? JSON.parse(val) : null;
  }
  async setJson(key: string, value: any, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // Sorted sets (for leaderboards)
  async zadd(key: string, score: number, member: string): Promise<void> {
    try { if (this.client) await this.client.zadd(key, score, member); } catch {}
  }
  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    try { return this.client ? await this.client.zrevrange(key, start, stop) : []; } catch { return []; }
  }
  async zrevrangeWithScores(key: string, start: number, stop: number): Promise<{ member: string; score: number }[]> {
    try {
      if (!this.client) return [];
      const result = await this.client.zrevrange(key, start, stop, 'WITHSCORES');
      const entries: { member: string; score: number }[] = [];
      for (let i = 0; i < result.length; i += 2) { entries.push({ member: result[i], score: parseFloat(result[i + 1]) }); }
      return entries;
    } catch { return []; }
  }
  async zrank(key: string, member: string): Promise<number | null> {
    try { return this.client ? await this.client.zrevrank(key, member) : null; } catch { return null; }
  }
  async zscore(key: string, member: string): Promise<number | null> {
    try {
      if (!this.client) return null;
      const score = await this.client.zscore(key, member);
      return score ? parseFloat(score) : null;
    } catch { return null; }
  }
  async zincrby(key: string, increment: number, member: string): Promise<number> {
    try {
      if (!this.client) return increment;
      const result = await this.client.zincrby(key, increment, member);
      return parseFloat(result);
    } catch { return increment; }
  }

  // Rate limiting helper
  async checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<boolean> {
    try {
      const current = await this.incr(key);
      if (current === 1 && this.client) { await this.client.expire(key, windowSeconds).catch(() => {}); }
      return current <= maxAttempts;
    } catch {
      return true;
    }
  }
}
