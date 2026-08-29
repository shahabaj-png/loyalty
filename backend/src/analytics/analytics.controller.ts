import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AdminGuard } from '../auth/jwt.guard';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard overview stats' })
  async getDashboard() { return this.analyticsService.getDashboard(); }

  @Get('points-timeseries')
  @ApiOperation({ summary: 'Get points earned/redeemed over time' })
  @ApiQuery({ name: 'days', required: false })
  async getPointsTimeSeries(@Query('days') days = 30) { return this.analyticsService.getPointsTimeSeries(days); }

  @Get('user-growth')
  @ApiOperation({ summary: 'Get new user signups over time' })
  @ApiQuery({ name: 'days', required: false })
  async getUserGrowth(@Query('days') days = 30) { return this.analyticsService.getUserGrowth(days); }

  @Get('top-rewards')
  @ApiOperation({ summary: 'Get most popular rewards' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopRewards(@Query('limit') limit = 10) { return this.analyticsService.getTopRewards(limit); }

  @Get('engagement')
  @ApiOperation({ summary: 'Get engagement metrics' })
  async getEngagement() { return this.analyticsService.getEngagementMetrics(); }
}
