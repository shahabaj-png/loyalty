import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { badges: { include: { badge: true } }, challenges: { include: { challenge: true }, where: { status: 'ACTIVE' } } },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, faceVector, ...safe } = user;
    return safe;
  }

  async findAll(page = 1, limit = 20, search?: string, tier?: string) {
    const where: any = { isActive: true };
    if (search) { where.OR = [{ email: { contains: search, mode: 'insensitive' } }, { firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }]; }
    if (tier) where.tier = tier;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, tier: true, totalPoints: true, availablePoints: true, lifetimePoints: true, streakDays: true, identityStatus: true, faceEnrolled: true, referralCode: true, createdAt: true } }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string; birthday?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data: dto, select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true, birthday: true, tier: true, totalPoints: true, availablePoints: true } });
  }

  async recalculateTier(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    let newTier: any = 'BRONZE';
    if (user.lifetimePoints >= 15000) newTier = 'PLATINUM';
    else if (user.lifetimePoints >= 5000) newTier = 'GOLD';
    else if (user.lifetimePoints >= 1000) newTier = 'SILVER';

    if (newTier !== user.tier) {
      await this.prisma.user.update({ where: { id: userId }, data: { tier: newTier } });
      return { previousTier: user.tier, newTier, upgraded: this.tierRank(newTier) > this.tierRank(user.tier) };
    }
    return null;
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where: { userId }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markNotificationRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { isRead: true } });
  }

  async getReferrals(userId: string) {
    return this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referee: { select: { firstName: true, lastName: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private tierRank(tier: string): number {
    const ranks: Record<string, number> = { BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4 };
    return ranks[tier] || 0;
  }
}
