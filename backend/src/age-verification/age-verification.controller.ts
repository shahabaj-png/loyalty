import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgeVerificationService } from './age-verification.service';
import { VerifyAgeDto } from './verify-age.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('Age Verification (Altria Compliance)')
@Controller('age-verification')
export class AgeVerificationController {
  constructor(private ageVerificationService: AgeVerificationService) {}

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify user DOB for 21+ tobacco compliance (Altria rule)' })
  async verifyAge(@Body() dto: VerifyAgeDto) {
    return this.ageVerificationService.verifyAge(dto);
  }

  @Get('status/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get age verification status and ATC21+ status for user' })
  async getAgeStatus(@Param('userId') userId: string) {
    return this.ageVerificationService.getAgeStatus(userId);
  }
}
