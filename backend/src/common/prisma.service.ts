import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      if (process.env.DATABASE_URL) {
        console.log('🔄 Syncing database schema with Prisma db push...');
        try {
          execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit' });
          console.log('✅ Database schema synced successfully.');
        } catch (dbPushError: any) {
          console.warn('⚠️ Automatic DB Push notice:', dbPushError?.message || dbPushError);
        }
      }

      await this.$connect();
      console.log('✅ Prisma connected to PostgreSQL database successfully.');

      // Check if user table has data; if empty, run auto-seed automatically
      const userCount = await this.user.count().catch(() => 0);
      if (userCount === 0) {
        await this.autoSeed();
      } else {
        // Also check if service plans exist
        const planCount = await this.servicePlan.count().catch(() => 0);
        if (planCount === 0) {
          await this.seedServicePlans();
        }
      }
    } catch (error) {
      console.error('❌ Prisma failed to connect to PostgreSQL database:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async seedServicePlans() {
    try {
      console.log('🌱 Seeding default service plans...');
      await this.servicePlan.createMany({
        data: [
          {
            name: 'Starter Plan',
            slug: 'starter-plan',
            description: 'Basic plan for small businesses',
            features: { maxUsers: 100, maxTenants: 1, apiRateLimit: 1000 },
            price: 29,
            billingCycle: 'MONTHLY',
            maxUsers: 100,
            maxTenants: 1,
            apiRateLimit: 1000,
          },
          {
            name: 'Pro Plan',
            slug: 'pro-plan',
            description: 'Advanced plan for growing enterprises',
            features: { maxUsers: 1000, maxTenants: 10, apiRateLimit: 10000 },
            price: 99,
            billingCycle: 'MONTHLY',
            maxUsers: 1000,
            maxTenants: 10,
            apiRateLimit: 10000,
          },
        ],
      });
      console.log('✅ Default service plans seeded.');
    } catch (e) {
      console.warn('⚠️ Service plans seeding notice:', e);
    }
  }

  private async autoSeed() {
    try {
      console.log('🌱 Auto-seeding initial database tables...');

      const adminPassword = await bcrypt.hash('Admin123!', 12);
      await this.user.create({
        data: {
          email: 'admin@loyaltyplatform.com',
          passwordHash: adminPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          tier: 'PLATINUM',
          referralCode: 'ADMIN001',
          totalPoints: 50000,
          availablePoints: 50000,
          lifetimePoints: 50000,
          identityStatus: 'VERIFIED',
          faceEnrolled: true,
        },
      });

      const demoPassword = await bcrypt.hash('Demo123!', 12);
      await Promise.all([
        this.user.create({ data: { email: 'gold@demo.com', passwordHash: demoPassword, firstName: 'Sarah', lastName: 'Johnson', tier: 'GOLD', referralCode: 'GOLD001', totalPoints: 7500, availablePoints: 5200, lifetimePoints: 7500, streakDays: 14, lastCheckIn: new Date(), identityStatus: 'VERIFIED' } }),
        this.user.create({ data: { email: 'silver@demo.com', passwordHash: demoPassword, firstName: 'Mike', lastName: 'Chen', tier: 'SILVER', referralCode: 'SILVER01', totalPoints: 2800, availablePoints: 1500, lifetimePoints: 2800, streakDays: 5, lastCheckIn: new Date() } }),
        this.user.create({ data: { email: 'bronze@demo.com', passwordHash: demoPassword, firstName: 'Emma', lastName: 'Davis', tier: 'BRONZE', referralCode: 'BRONZE1', totalPoints: 450, availablePoints: 450, lifetimePoints: 450 } }),
      ]);

      await Promise.all([
        this.reward.create({ data: { name: '$5 Gift Card', description: 'Digital gift card redeemable at participating stores', pointsCost: 500, category: 'Gift Cards', minTier: 'BRONZE', stock: 100 } }),
        this.reward.create({ data: { name: '$25 Gift Card', description: 'Premium digital gift card', pointsCost: 2000, category: 'Gift Cards', minTier: 'SILVER', stock: 50 } }),
        this.reward.create({ data: { name: 'Free Coffee', description: 'Redeemable at any partner cafe', pointsCost: 200, category: 'Food & Drink', minTier: 'BRONZE', stock: 200 } }),
        this.reward.create({ data: { name: 'Movie Ticket', description: 'One movie ticket at AMC theaters', pointsCost: 1500, category: 'Entertainment', minTier: 'SILVER', stock: 75 } }),
        this.reward.create({ data: { name: 'VIP Event Access', description: 'Exclusive access to special events', pointsCost: 5000, category: 'Experiences', minTier: 'GOLD', stock: 20 } }),
      ]);

      await Promise.all([
        this.badge.create({ data: { name: 'Welcome Aboard', description: 'Created your account', iconUrl: '/badges/welcome.png', category: 'Milestones', criteria: { type: 'registration', threshold: 1 }, pointsReward: 50, rarity: 'COMMON' } }),
        this.badge.create({ data: { name: 'First Purchase', description: 'Earned points from your first purchase', iconUrl: '/badges/first-purchase.png', category: 'Shopping', criteria: { type: 'purchase_count', threshold: 1 }, pointsReward: 100, rarity: 'COMMON' } }),
        this.badge.create({ data: { name: 'Week Warrior', description: '7-day check-in streak', iconUrl: '/badges/week.png', category: 'Streaks', criteria: { type: 'streak', threshold: 7 }, pointsReward: 200, rarity: 'UNCOMMON' } }),
      ]);

      const now = new Date();
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await Promise.all([
        this.challenge.create({ data: { name: 'Daily Check-in Sprint', description: 'Check in 5 times this week', type: 'WEEKLY', pointsReward: 200, criteria: { action: 'check_in', target: 5 }, startsAt: now, endsAt: weekLater } }),
        this.challenge.create({ data: { name: 'Refer a Friend', description: 'Successfully refer 1 friend', type: 'SPECIAL', pointsReward: 1000, criteria: { action: 'referral', target: 1 }, startsAt: now, endsAt: weekLater } }),
      ]);

      await Promise.all([
        this.pointRule.create({ data: { name: 'Purchase Points', event: 'purchase', basePoints: 1, multiplierField: 'amount', maxPoints: 5000, cooldownMinutes: 1 } }),
        this.pointRule.create({ data: { name: 'Review Bonus', event: 'review_submitted', basePoints: 50, cooldownMinutes: 1440 } }),
        this.pointRule.create({ data: { name: 'Profile Complete', event: 'profile_completed', basePoints: 100 } }),
      ]);

      await this.seedServicePlans();

      console.log('✅ Auto-seed complete! Admin account admin@loyaltyplatform.com created.');
    } catch (e) {
      console.error('⚠️ Auto-seed notice:', e);
    }
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'production') {
      const models = Reflect.ownKeys(this).filter((key) => typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'));
      return Promise.all(models.map((modelKey) => (this as any)[modelKey]?.deleteMany?.()));
    }
  }
}
