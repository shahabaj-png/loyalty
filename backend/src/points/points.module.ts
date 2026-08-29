import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    BullModule.registerQueue({ name: 'points' }),
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
