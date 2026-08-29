import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard, AdminGuard } from '../auth/jwt.guard';

class CheckInDto {
  @IsOptional() @IsString() locationId?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
}

class CreateChallengeDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsString() type: string;
  @IsNumber() pointsReward: number;
  criteria: any;
  @IsDateString() startsAt: string;
  @IsDateString() endsAt: string;
  @IsOptional() @IsNumber() maxParticipants?: number;
}

class CreateBadgeDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsString() iconUrl: string;
  @IsString() category: string;
  criteria: any;
  @IsOptional() @IsNumber() pointsReward?: number;
  @IsOptional() @IsString() rarity?: string;
}

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  // ---- Check-ins ----
  @Post('checkin')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Daily check-in with streak tracking' })
  async checkIn(@Request() req: any, @Body() dto: CheckInDto) {
    return this.gamificationService.checkIn(req.user.id, dto.locationId, dto.latitude, dto.longitude);
  }

  // ---- Challenges ----
  @Get('challenges')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active challenges' })
  async getChallenges(@Request() req: any) {
    return this.gamificationService.getActiveChallenges(req.user.id);
  }

  @Post('challenges/:id/join')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a challenge' })
  async joinChallenge(@Request() req: any, @Param('id') id: string) {
    return this.gamificationService.joinChallenge(req.user.id, id);
  }

  @Post('challenges')
  @UseGuards(AdminGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a challenge (admin)' })
  async createChallenge(@Body() dto: CreateChallengeDto) { return this.gamificationService.createChallenge(dto); }

  @Put('challenges/:id')
  @UseGuards(AdminGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a challenge (admin)' })
  async updateChallenge(@Param('id') id: string, @Body() dto: Partial<CreateChallengeDto>) {
    return this.gamificationService.updateChallenge(id, dto);
  }

  // ---- Badges ----
  @Get('badges')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user badges (earned + locked)' })
  async getBadges(@Request() req: any) {
    return this.gamificationService.getUserBadges(req.user.id);
  }

  @Post('badges')
  @UseGuards(AdminGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a badge (admin)' })
  async createBadge(@Body() dto: CreateBadgeDto) { return this.gamificationService.createBadge(dto); }

  // ---- Leaderboard ----
  @Get('leaderboard')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['monthly', 'alltime'] })
  @ApiQuery({ name: 'limit', required: false })
  async getLeaderboard(@Query('period') period: 'monthly' | 'alltime' = 'monthly', @Query('limit') limit = 50) {
    return this.gamificationService.getLeaderboard(period, limit);
  }

  @Get('leaderboard/me')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my leaderboard rank' })
  async getMyRank(@Request() req: any, @Query('period') period: 'monthly' | 'alltime' = 'monthly') {
    return this.gamificationService.getUserRank(req.user.id, period);
  }

  // ---- Spin Wheel ----
  @Post('spin')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Spin the prize wheel (once per 24h)' })
  async spinWheel(@Request() req: any) {
    return this.gamificationService.spinWheel(req.user.id);
  }
}
