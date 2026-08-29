import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { PointsService } from '../points/points.service';

@Injectable()
export class GamificationService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private pointsService: PointsService,
  ) {}

  // ============ CHECK-INS & STREAKS ============
  async checkIn(userId: string, locationId?: string, latitude?: number, longitude?: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if already checked in today
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await this.prisma.checkIn.findFirst({ where: { userId, createdAt: { gte: today } } });
    if (existing) throw new BadRequestException('Already checked in today');

    // Calculate streak
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const hadYesterdayCheckin = user.lastCheckIn && new Date(user.lastCheckIn) >= yesterday;
    const streakDays = hadYesterdayCheckin ? user.streakDays + 1 : 1;
    const streakBonus = Math.min(streakDays * 2, 50); // Max 50 bonus
    const basePoints = 10;
    const totalPoints = basePoints + streakBonus;

    // Create check-in
    const checkIn = await this.prisma.checkIn.create({
      data: { userId, locationId, pointsEarned: totalPoints, streakDay: streakDays, streakBonus, latitude, longitude },
    });

    // Update user streak
    await this.prisma.user.update({ where: { id: userId }, data: { streakDays, lastCheckIn: new Date() } });

    // Award points
    await this.pointsService.earnPoints({
      userId, amount: totalPoints, source: 'check_in',
      description: `Daily check-in (Day ${streakDays})`,
      metadata: { checkInId: checkIn.id, streakDays, streakBonus },
    });

    // Check streak-based badges
    await this.checkStreakBadges(userId, streakDays);

    return { checkIn, streakDays, basePoints, streakBonus, totalPoints };
  }

  // ============ CHALLENGES ============
  async getActiveChallenges(userId: string) {
    const now = new Date();
    const challenges = await this.prisma.challenge.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { endsAt: 'asc' },
    });

    const userChallenges = await this.prisma.userChallenge.findMany({
      where: { userId, challengeId: { in: challenges.map(c => c.id) } },
    });

    const joinedMap = new Map(userChallenges.map(uc => [uc.challengeId, uc]));

    return challenges.map(c => ({
      ...c,
      joined: joinedMap.has(c.id),
      progress: joinedMap.get(c.id)?.progress || 0,
      status: joinedMap.get(c.id)?.status || 'AVAILABLE',
      participantCount: undefined, // Will be filled
    }));
  }

  async joinChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || !challenge.isActive) throw new NotFoundException('Challenge not found');
    if (new Date() > challenge.endsAt) throw new BadRequestException('Challenge has ended');

    const existing = await this.prisma.userChallenge.findUnique({ where: { userId_challengeId: { userId, challengeId } } });
    if (existing) throw new BadRequestException('Already joined this challenge');

    if (challenge.maxParticipants) {
      const count = await this.prisma.userChallenge.count({ where: { challengeId } });
      if (count >= challenge.maxParticipants) throw new BadRequestException('Challenge is full');
    }

    return this.prisma.userChallenge.create({ data: { userId, challengeId }, include: { challenge: true } });
  }

  async updateChallengeProgress(userId: string, challengeId: string, incrementBy: number) {
    const uc = await this.prisma.userChallenge.findUnique({ where: { userId_challengeId: { userId, challengeId } }, include: { challenge: true } });
    if (!uc || uc.status === 'COMPLETED') return null;

    const criteria = uc.challenge.criteria as any;
    const newProgress = Math.min(uc.progress + incrementBy, criteria.target);
    const completed = newProgress >= criteria.target;

    const updated = await this.prisma.userChallenge.update({
      where: { id: uc.id },
      data: { progress: newProgress, ...(completed ? { status: 'COMPLETED', completedAt: new Date() } : {}) },
      include: { challenge: true },
    });

    if (completed) {
      await this.pointsService.earnPoints({
        userId, amount: uc.challenge.pointsReward, source: 'challenge_completion',
        description: `Completed challenge: ${uc.challenge.name}`,
        metadata: { challengeId },
      });

      await this.prisma.notification.create({
        data: { userId, title: '🏆 Challenge Complete!', body: `You completed "${uc.challenge.name}" and earned ${uc.challenge.pointsReward} points!`, type: 'CHALLENGE_COMPLETE', data: { challengeId } },
      });
    }

    return updated;
  }

  // Admin challenge CRUD
  async createChallenge(dto: any) { return this.prisma.challenge.create({ data: dto }); }
  async updateChallenge(id: string, dto: any) { return this.prisma.challenge.update({ where: { id }, data: dto }); }

  // ============ BADGES ============
  async getUserBadges(userId: string) {
    const earned = await this.prisma.userBadge.findMany({ where: { userId }, include: { badge: true }, orderBy: { earnedAt: 'desc' } });
    const allBadges = await this.prisma.badge.findMany({ where: { isActive: true } });

    const earnedIds = new Set(earned.map(e => e.badgeId));
    const locked = allBadges.filter(b => !earnedIds.has(b.id)).map(b => ({ ...b, locked: true, progress: 0 }));

    return { earned, locked, total: allBadges.length, unlocked: earned.length };
  }

  async awardBadge(userId: string, badgeId: string) {
    const existing = await this.prisma.userBadge.findUnique({ where: { userId_badgeId: { userId, badgeId } } });
    if (existing) return existing;

    const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge) return null;

    const userBadge = await this.prisma.userBadge.create({ data: { userId, badgeId, progress: 100 }, include: { badge: true } });

    if (badge.pointsReward > 0) {
      await this.pointsService.earnPoints({
        userId, amount: badge.pointsReward, source: 'badge_earned',
        description: `Badge earned: ${badge.name}`, metadata: { badgeId },
      });
    }

    await this.prisma.notification.create({
      data: { userId, title: '🏅 New Badge!', body: `You earned the "${badge.name}" badge!`, type: 'BADGE_EARNED', data: { badgeId, badge: badge.name } },
    });

    return userBadge;
  }

  private async checkStreakBadges(userId: string, streakDays: number) {
    const streakBadges: Record<number, string> = { 7: 'Week Warrior', 30: 'Monthly Master', 100: 'Century Streak', 365: 'Year of Loyalty' };
    const badgeName = streakBadges[streakDays];
    if (badgeName) {
      const badge = await this.prisma.badge.findFirst({ where: { name: badgeName } });
      if (badge) await this.awardBadge(userId, badge.id);
    }
  }

  // Admin badge CRUD
  async createBadge(dto: any) { return this.prisma.badge.create({ data: dto }); }
  async updateBadge(id: string, dto: any) { return this.prisma.badge.update({ where: { id }, data: dto }); }

  // ============ LEADERBOARD ============
  async getLeaderboard(period: 'monthly' | 'alltime' = 'monthly', limit = 50) {
    const key = `leaderboard:${period}`;
    const entries = await this.redis.zrevrangeWithScores(key, 0, limit - 1);

    if (entries.length === 0) return [];

    const userIds = entries.map(e => e.member);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true, tier: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return entries.map((entry, index) => {
      const user = userMap.get(entry.member);
      return {
        rank: index + 1,
        userId: entry.member,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        avatarUrl: user?.avatarUrl,
        tier: user?.tier,
        score: entry.score,
      };
    });
  }

  async getUserRank(userId: string, period: 'monthly' | 'alltime' = 'monthly') {
    const key = `leaderboard:${period}`;
    const rank = await this.redis.zrank(key, userId);
    const score = await this.redis.zscore(key, userId);
    return { rank: rank !== null ? rank + 1 : null, score: score || 0, period };
  }

  // ============ SPIN WHEEL ============
  async spinWheel(userId: string) {
    // Check cooldown (24 hours)
    const lastSpin = await this.prisma.spinWheelHistory.findFirst({ where: { userId }, orderBy: { spunAt: 'desc' } });
    if (lastSpin) {
      const hoursSince = (Date.now() - lastSpin.spunAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) throw new BadRequestException(`Spin available in ${Math.ceil(24 - hoursSince)} hours`);
    }

    // Weighted random prize
    const prizes = [
      { prize: '10 Points', points: 10, weight: 30 },
      { prize: '25 Points', points: 25, weight: 25 },
      { prize: '50 Points', points: 50, weight: 20 },
      { prize: '100 Points', points: 100, weight: 12 },
      { prize: '250 Points', points: 250, weight: 8 },
      { prize: '500 Points', points: 500, weight: 4 },
      { prize: '1000 Points', points: 1000, weight: 1 },
    ];

    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    let selected = prizes[0];
    for (const prize of prizes) {
      random -= prize.weight;
      if (random <= 0) { selected = prize; break; }
    }

    // Record spin and award points
    const spin = await this.prisma.spinWheelHistory.create({
      data: { userId, prize: selected.prize, points: selected.points },
    });

    await this.pointsService.earnPoints({
      userId, amount: selected.points, source: 'spin_wheel',
      description: `Spin wheel: ${selected.prize}`, metadata: { spinId: spin.id },
    });

    return { prize: selected.prize, points: selected.points, spinId: spin.id };
  }
}
