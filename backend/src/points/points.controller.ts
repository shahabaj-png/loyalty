import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsObject, Min } from 'class-validator';
import { PointsService } from './points.service';
import { JwtAuthGuard, AdminGuard } from '../auth/jwt.guard';

class EarnPointsDto {
  @IsString() userId: string;
  @IsNumber() @Min(1) amount: number;
  @IsString() source: string;
  @IsString() description: string;
  @IsOptional() @IsObject() metadata?: Record<string, any>;
}

class RedeemDto { @IsString() rewardId: string; }

class CreateRuleDto {
  @IsString() name: string;
  @IsString() event: string;
  @IsNumber() basePoints: number;
  @IsOptional() @IsString() multiplierField?: string;
  @IsOptional() @IsNumber() maxPoints?: number;
  @IsOptional() @IsNumber() cooldownMinutes?: number;
  @IsOptional() conditions?: any[];
}

class ProcessEventDto {
  @IsString() event: string;
  @IsString() userId: string;
  @IsObject() data: Record<string, any>;
}

@ApiTags('Points')
@Controller('points')
export class PointsController {
  constructor(private pointsService: PointsService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current points balance' })
  async getBalance(@Request() req: any) {
    return this.pointsService.getBalance(req.user.id);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get points transaction history' })
  @ApiQuery({ name: 'type', required: false, enum: ['EARN', 'REDEEM', 'BONUS', 'EXPIRE'] })
  async getTransactions(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 20, @Query('type') type?: string) {
    return this.pointsService.getTransactions(req.user.id, page, limit, type);
  }

  @Post('earn')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Award points to a user (admin/API)' })
  async earnPoints(@Body() dto: EarnPointsDto) {
    return this.pointsService.earnPoints(dto);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Redeem points for a reward' })
  async redeemPoints(@Request() req: any, @Body() dto: RedeemDto) {
    return this.pointsService.redeemPoints(req.user.id, dto.rewardId);
  }

  @Post('process-event')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process an event through the rules engine' })
  async processEvent(@Body() dto: ProcessEventDto) {
    return this.pointsService.processEvent(dto.event, dto.userId, dto.data);
  }

  // ---- Admin: Point Rules ----
  @Get('rules')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all point rules (admin)' })
  async listRules() { return this.pointsService.listRules(); }

  @Post('rules')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a point rule (admin)' })
  async createRule(@Body() dto: CreateRuleDto) { return this.pointsService.createRule(dto); }

  @Put('rules/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a point rule (admin)' })
  async updateRule(@Param('id') id: string, @Body() dto: Partial<CreateRuleDto>) { return this.pointsService.updateRule(id, dto); }
}
