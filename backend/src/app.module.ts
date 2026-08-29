import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PointsModule } from './points/points.module';
import { RewardsModule } from './rewards/rewards.module';
import { GamificationModule } from './gamification/gamification.module';
import { IdentityModule } from './identity/identity.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Job queues
    BullModule.forRoot({
      redis: { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') },
    }),

    // Feature modules
    CommonModule,
    AuthModule,
    UsersModule,
    PointsModule,
    RewardsModule,
    GamificationModule,
    IdentityModule,
    WebhooksModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
