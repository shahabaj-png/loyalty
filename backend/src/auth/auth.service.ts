import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
  ) {}

  async register(dto: { email: string; password: string; firstName: string; lastName: string; phone?: string; referralCode?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const referralCode = nanoid(8).toUpperCase();

    let referredBy: string | undefined;
    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({ where: { referralCode: dto.referralCode } });
      if (referrer) referredBy = referrer.id;
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        referralCode,
        referredBy,
      },
    });

    // Handle referral bonus
    if (referredBy) {
      await this.prisma.referral.create({
        data: { referrerId: referredBy, refereeId: user.id, status: 'COMPLETED', bonusPaid: false },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      const update: any = { loginAttempts: attempts };
      if (attempts >= 5) {
        update.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        update.loginAttempts = 0;
      }
      await this.prisma.user.update({ where: { id: user.id }, data: update });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { loginAttempts: 0, lockedUntil: null } });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async refreshToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // Rotate refresh token
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // Invalidate all refresh tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Password changed successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = nanoid(64);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, faceVector, lockedUntil, loginAttempts, ...safe } = user;
    return safe;
  }
}
