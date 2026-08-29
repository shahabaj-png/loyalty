import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async getCatalog(page = 1, limit = 20, category?: string, userTier?: string) {
    const where: any = { isActive: true, validFrom: { lte: new Date() }, OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] };
    if (category) where.category = category;

    // Cache catalog
    const cacheKey = `rewards:catalog:${page}:${limit}:${category || 'all'}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      this.prisma.reward.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { pointsCost: 'asc' } }),
      this.prisma.reward.count({ where }),
    ]);

    // Tag rewards user can/can't afford
    const result = { data, total, page, limit, totalPages: Math.ceil(total / limit), categories: await this.getCategories() };
    await this.redis.setJson(cacheKey, result, 300); // 5 min cache
    return result;
  }

  async getRewardById(id: string) {
    const reward = await this.prisma.reward.findUnique({ where: { id } });
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }

  async getUserRewards(userId: string, status?: string) {
    const where: any = { userId };
    if (status) where.status = status;
    return this.prisma.userReward.findMany({ where, include: { reward: true }, orderBy: { claimedAt: 'desc' } });
  }

  async getCategories() {
    const rewards = await this.prisma.reward.findMany({ where: { isActive: true }, select: { category: true }, distinct: ['category'] });
    return rewards.map(r => r.category);
  }

  async markRedeemed(userRewardId: string, userId: string) {
    const userReward = await this.prisma.userReward.findFirst({ where: { id: userRewardId, userId } });
    if (!userReward) throw new NotFoundException('Reward claim not found');
    if (userReward.status !== 'CLAIMED') throw new BadRequestException('Reward already redeemed or expired');
    return this.prisma.userReward.update({ where: { id: userRewardId }, data: { status: 'REDEEMED', redeemedAt: new Date() } });
  }

  // ---- Admin ----
  async createReward(dto: { name: string; description: string; imageUrl?: string; pointsCost: number; category: string; minTier?: any; stock?: number; validUntil?: Date }) {
    await this.redis.del('rewards:catalog:*'); // Invalidate cache
    return this.prisma.reward.create({ data: dto as any });
  }

  async updateReward(id: string, dto: Partial<{ name: string; description: string; pointsCost: number; isActive: boolean; stock: number }>) {
    return this.prisma.reward.update({ where: { id }, data: dto });
  }

  async deleteReward(id: string) {
    return this.prisma.reward.update({ where: { id }, data: { isActive: false } });
  }
}
