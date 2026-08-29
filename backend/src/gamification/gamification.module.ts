import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { PointsModule } from '../points/points.module';
@Module({ imports: [PointsModule], controllers: [GamificationController], providers: [GamificationService], exports: [GamificationService] })
export class GamificationModule {}
