import { Module } from '@nestjs/common';
import { AgeVerificationService } from './age-verification.service';
import { AgeVerificationController } from './age-verification.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  providers: [AgeVerificationService, PrismaService],
  controllers: [AgeVerificationController],
  exports: [AgeVerificationService],
})
export class AgeVerificationModule {}
