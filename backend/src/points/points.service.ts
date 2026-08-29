import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PointsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private usersService: UsersService,
  ) {}

  async earnPoints(dto: { userId: string; amount: number; source: string; description: string; metadata?: any }) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    // Apply tier multiplier
    const multiplier = this.getTierMultiplier(user.tier);
    const earnedAmount = Math.floor(dto.amount * multiplier);

    // Create transaction and update balances atomically
    const [transaction] = await this.prisma.$transaction([
      this.prisma.pointTransaction.create({
        data: {
          userId: dto.userId,
          type: 'EARN',
          amount: earnedAmount,
          balance: user.availablePoints + earnedAmount,
          description: dto.description,
          source: dto.source,
          metadata: dto.metadata,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      }),
      this.prisma.user.update({
        where: { id: dto.userId },
        data: {
          availablePoints: { increment: earnedAmount },
          totalPoints: { increment: earnedAmount },
          lifetimePoints: { increment: earnedAmount },
        },
      }),
    ]);

    // Update leaderboard in Redis
    await this.redis.zincrby('leaderboard:monthly', earnedAmount, dto.userId);
    await this.redis.zincrby('leaderboard:alltime', earnedAmount, dto.userId);

    // Check tier upgrade
    const tierChange = await this.usersService.recalculateTier(dto.userId);

    // Notify about tier change
    if (tierChange?.upgraded) {
      await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          title: '🎉 Tier Upgrade!',
          body: `Congratulations! You've been upgraded to ${tierChange.newTier}!`,
          type: 'TIER_UPGRADE',
          data: tierChange,
        },
      });
    }

    return { transaction, earnedAmount, multiplier, tierChange };
  }

  async redeemPoints(userId: string, rewardId: string) {
    const [user, reward] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.reward.findUnique({ where: { id: rewardId } }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!reward || !reward.isActive) throw new NotFoundException('Reward not found');

    const tierRanks: Record<string, number> = { BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4 };
    if (tierRanks[user.tier] < tierRanks[reward.minTier]) {
      throw new BadRequestException(`This reward requires ${reward.minTier} tier or above`);
    }

    if (user.availablePoints < reward.pointsCost) {
      throw new BadRequestException(`Insufficient points. Need ${reward.pointsCost}, have ${user.availablePoints}`);
    }

    if (reward.stock !== null && reward.stock <= 0) {
      throw new BadRequestException('Reward out of stock');
    }

    // Generate redemption code
    const { nanoid } = await import('nanoid');
    const redemptionCode = nanoid(12).toUpperCase();

    // Atomic transaction
    const [transaction, userReward] = await this.prisma.$transaction([
      this.prisma.pointTransaction.create({
        data: {
          userId,
          type: 'REDEEM',
          amount: -reward.pointsCost,
          balance: user.availablePoints - reward.pointsCost,
          description: `Redeemed: ${reward.name}`,
          source: 'reward_redemption',
          metadata: { rewardId, redemptionCode },
        },
      }),
      this.prisma.userReward.create({
        data: {
          userId,
          rewardId,
          status: 'CLAIMED',
          redemptionCode,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        include: { reward: true },
      }),
      this.prisma.user.update({ where: { id: userId }, data: { availablePoints: { decrement: reward.pointsCost } } }),
      ...(reward.stock !== null ? [this.prisma.reward.update({ where: { id: rewardId }, data: { stock: { decrement: 1 } } })] : []),
    ]);

    return { transaction, userReward, redemptionCode };
  }

  async getTransactions(userId: string, page = 1, limit = 20, type?: string) {
    const where: any = { userId };
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.pointTransaction.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.pointTransaction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { availablePoints: true, totalPoints: true, lifetimePoints: true, tier: true } });
    if (!user) throw new NotFoundException('User not found');

    const pendingExpiry = await this.prisma.pointTransaction.aggregate({
      where: { userId, type: 'EARN', expiresAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() } },
      _sum: { amount: true },
    });

    return { ...user, expiringIn30Days: pendingExpiry._sum.amount || 0, multiplier: this.getTierMultiplier(user.tier) };
  }

  // ---- Point Rules Engine ----
  async processEvent(eventName: string, userId: string, eventData: Record<string, any>) {
    const rules = await this.prisma.pointRule.findMany({ where: { event: eventName, isActive: true } });

    let totalEarned = 0;
    for (const rule of rules) {
      if (!this.evaluateConditions(rule.conditions as any[], eventData)) continue;

      // Check cooldown
      if (rule.cooldownMinutes) {
        const cooldownKey = `cooldown:${rule.id}:${userId}`;
        const allowed = await this.redis.checkRateLimit(cooldownKey, 1, rule.cooldownMinutes * 60);
        if (!allowed) continue;
      }

      let points = rule.basePoints;
      if (rule.multiplierField && eventData[rule.multiplierField]) {
        points = Math.floor(points * eventData[rule.multiplierField]);
      }
      if (rule.maxPoints) points = Math.min(points, rule.maxPoints);

      const result = await this.earnPoints({
        userId,
        amount: points,
        source: `rule:${rule.name}`,
        description: `Points from ${rule.name}`,
        metadata: { ruleId: rule.id, event: eventName, ...eventData },
      });
      totalEarned += result.earnedAmount;
    }

    return { totalEarned, rulesTriggered: rules.length };
  }

  // ---- Admin: CRUD Point Rules ----
  async createRule(dto: { name: string; event: string; basePoints: number; multiplierField?: string; maxPoints?: number; cooldownMinutes?: number; conditions?: any[] }) {
    return this.prisma.pointRule.create({ data: dto });
  }

  async updateRule(id: string, dto: Partial<{ name: string; event: string; basePoints: number; isActive: boolean; conditions: any[] }>) {
    return this.prisma.pointRule.update({ where: { id }, data: dto });
  }

  async listRules() {
    return this.prisma.pointRule.findMany({ orderBy: { createdAt: 'desc' } });
  }

  private getTierMultiplier(tier: string): number {
    const multipliers: Record<string, number> = { BRONZE: 1.0, SILVER: 1.25, GOLD: 1.5, PLATINUM: 2.0 };
    return multipliers[tier] || 1.0;
  }

  private evaluateConditions(conditions: any[] | null, data: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(c => {
      const val = data[c.field];
      switch (c.operator) {
        case 'eq': return val === c.value;
        case 'neq': return val !== c.value;
        case 'gt': return val > c.value;
        case 'gte': return val >= c.value;
        case 'lt': return val < c.value;
        case 'lte': return val <= c.value;
        case 'in': return Array.isArray(c.value) && c.value.includes(val);
        case 'contains': return typeof val === 'string' && val.includes(c.value);
        default: return true;
      }
    });
  }
}
