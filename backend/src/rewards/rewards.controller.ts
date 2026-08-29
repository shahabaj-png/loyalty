import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard, AdminGuard } from '../auth/jwt.guard';

class CreateRewardDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsNumber() @Min(1) pointsCost: number;
  @IsString() category: string;
  @IsOptional() @IsString() minTier?: string;
  @IsOptional() @IsNumber() stock?: number;
}

@ApiTags('Rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  @Get('catalog')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Browse rewards catalog' })
  @ApiQuery({ name: 'category', required: false })
  async getCatalog(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 20, @Query('category') category?: string) {
    return this.rewardsService.getCatalog(page, limit, category, req.user.tier);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my claimed rewards' })
  async getMyRewards(@Request() req: any, @Query('status') status?: string) {
    return this.rewardsService.getUserRewards(req.user.id, status);
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reward categories' })
  async getCategories() { return this.rewardsService.getCategories(); }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reward details' })
  async getReward(@Param('id') id: string) { return this.rewardsService.getRewardById(id); }

  @Post(':id/redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a claimed reward as redeemed' })
  async markRedeemed(@Request() req: any, @Param('id') id: string) {
    return this.rewardsService.markRedeemed(id, req.user.id);
  }

  // Admin
  @Post()
  @UseGuards(AdminGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a reward (admin)' })
  async create(@Body() dto: CreateRewardDto) { return this.rewardsService.createReward(dto); }

  @Put(':id')
  @UseGuards(AdminGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a reward (admin)' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateRewardDto>) { return this.rewardsService.updateReward(id, dto); }

  @Delete(':id')
  @UseGuards(AdminGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a reward (admin)' })
  async delete(@Param('id') id: string) { return this.rewardsService.deleteReward(id); }
}
