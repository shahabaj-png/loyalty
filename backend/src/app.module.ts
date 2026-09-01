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

import { AppController } from './app.controller';

@Module({
  imports: [
    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Job queues
    BullModule.forRoot({
      url: process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL,
      redis: (process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL) ? undefined : {
        host: process.env.REDIS_HOST || process.env.REDISHOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || process.env.REDISPORT || '6379'),
        password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
      },
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
  controllers: [AppController],
})
export class AppModule {}
