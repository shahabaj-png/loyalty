import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

import { IsString, IsOptional, IsDateString } from 'class-validator';

export class VerifyAgeDto {
  @IsString() userId: string;
  @IsString() documentType: string; // E.g., 'DRIVERS_LICENSE', 'PASSPORT', 'STATE_ID'
  @IsOptional() @IsString() documentNumber?: string;
  @IsDateString() dateOfBirth: string; // ISO date format YYYY-MM-DD
}

@Injectable()
export class AgeVerificationService {
  constructor(private prisma: PrismaService) {}

  async verifyAge(dto: VerifyAgeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const dob = new Date(dto.dateOfBirth);
    if (isNaN(dob.getTime())) throw new BadRequestException('Invalid date of birth');

    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    const is21Plus = age >= 21;
    const status = is21Plus ? 'VERIFIED' : 'FAILED';

    // Increment scan count and check if user qualifies for ATC21+ status
    const newScanCount = is21Plus ? user.avtScanCount + 1 : user.avtScanCount;
    const isATC21Plus = is21Plus && (newScanCount >= 3 || user.isATC21Plus);

    // Record document verification
    const doc = await this.prisma.identityDocument.create({
      data: {
        userId: dto.userId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber || null,
        status,
        verifiedAt: is21Plus ? new Date() : null,
        ocrData: { age, calculatedAt: new Date().toISOString() },
      },
    });

    // Update User record
    await this.prisma.user.update({
      where: { id: dto.userId },
      data: {
        birthday: dob,
        identityStatus: is21Plus ? 'VERIFIED' : 'FAILED',
        avtScanCount: newScanCount,
        isATC21Plus,
      },
    });

    return {
      userId: dto.userId,
      age,
      is21Plus,
      isATC21Plus,
      scanCount: newScanCount,
      verificationStatus: status,
      documentId: doc.id,
      message: is21Plus
        ? `Age verified successfully (${age} years old). ${isATC21Plus ? 'Qualified for ATC21+ Tobacco Offers!' : `Scan ${newScanCount}/3 for ATC21+ status.`}`
        : `Age verification failed. Must be 21+ years old (Current age: ${age}).`,
    };
  }

  async getAgeStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        birthday: true,
        identityStatus: true,
        isATC21Plus: true,
        avtScanCount: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const history = await this.prisma.identityDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      user,
      verificationHistory: history,
    };
  }
}
