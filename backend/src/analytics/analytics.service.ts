import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async getDashboard() {
    const cacheKey = 'analytics:dashboard';
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, activeUsers, tierDistribution,
      pointsIssued, pointsRedeemed, rewardsClaimed,
      recentTransactions,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { lastCheckIn: { gte: thirtyDaysAgo } } }),
      this.prisma.user.groupBy({ by: ['tier'], _count: { id: true } }),
      this.prisma.pointTransaction.aggregate({ where: { type: 'EARN' }, _sum: { amount: true } }),
      this.prisma.pointTransaction.aggregate({ where: { type: 'REDEEM' }, _sum: { amount: true } }),
      this.prisma.userReward.count(),
      this.prisma.pointTransaction.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true } } } }),
    ]);

    const dashboard = {
      totalUsers,
      activeUsers,
      totalPointsIssued: pointsIssued._sum.amount || 0,
      totalPointsRedeemed: Math.abs(pointsRedeemed._sum.amount || 0),
      totalRewardsClaimed: rewardsClaimed,
      averagePointsPerUser: totalUsers > 0 ? Math.round((pointsIssued._sum.amount || 0) / totalUsers) : 0,
      tierDistribution: Object.fromEntries(tierDistribution.map(t => [t.tier, t._count.id])),
      recentActivity: recentTransactions.map(t => ({
        id: t.id, type: t.type, userId: t.userId,
        userName: `${t.user.firstName} ${t.user.lastName}`,
        description: t.description, timestamp: t.createdAt.toISOString(),
      })),
    };

    await this.redis.setJson(cacheKey, dashboard, 60); // 1 min cache
    return dashboard;
  }

  async getPointsTimeSeries(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const transactions = await this.prisma.pointTransaction.findMany({
      where: { createdAt: { gte: startDate } },
      select: { type: true, amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const byDate = new Map<string, { earned: number; redeemed: number }>();
    for (const t of transactions) {
      const date = t.createdAt.toISOString().split('T')[0];
      if (!byDate.has(date)) byDate.set(date, { earned: 0, redeemed: 0 });
      const entry = byDate.get(date)!;
      if (t.type === 'EARN' || t.type === 'BONUS' || t.type === 'REFERRAL') entry.earned += t.amount;
      if (t.type === 'REDEEM') entry.redeemed += Math.abs(t.amount);
    }

    return Array.from(byDate.entries()).map(([date, data]) => ({ date, ...data }));
  }

  async getUserGrowth(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDate = new Map<string, number>();
    for (const u of users) {
      const date = u.createdAt.toISOString().split('T')[0];
      byDate.set(date, (byDate.get(date) || 0) + 1);
    }

    return Array.from(byDate.entries()).map(([date, count]) => ({ date, newUsers: count }));
  }

  async getTopRewards(limit = 10) {
    const rewards = await this.prisma.userReward.groupBy({
      by: ['rewardId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const rewardDetails = await this.prisma.reward.findMany({
      where: { id: { in: rewards.map(r => r.rewardId) } },
    });
    const detailMap = new Map(rewardDetails.map(r => [r.id, r]));

    return rewards.map(r => ({
      reward: detailMap.get(r.rewardId),
      claimCount: r._count.id,
    }));
  }

  async getEngagementMetrics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [dailyCheckins, weeklyActiveUsers, challengeParticipation, badgesEarned] = await Promise.all([
      this.prisma.checkIn.count({ where: { createdAt: { gte: today } } }),
      this.prisma.checkIn.groupBy({ by: ['userId'], where: { createdAt: { gte: thisWeek } } }),
      this.prisma.userChallenge.count({ where: { status: 'ACTIVE' } }),
      this.prisma.userBadge.count({ where: { earnedAt: { gte: thisWeek } } }),
    ]);

    return { dailyCheckins, weeklyActiveUsers: weeklyActiveUsers.length, activeChallengeParticipants: challengeParticipation, badgesEarnedThisWeek: badgesEarned };
  }
}
