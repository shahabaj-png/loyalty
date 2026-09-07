import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard, AdminGuard } from '../auth/jwt.guard';

class CreateSubscriptionDto {
  @IsString() tenantId: string;
  @IsString() planId: string;
  @IsOptional() @IsNumber() trialDays?: number;
}

class UpgradePlanDto {
  @IsString() newPlanId: string;
}

class CancelSubscriptionDto {
  @IsOptional() @IsBoolean() immediate?: boolean;
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  async createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(dto.tenantId, dto.planId, dto.trialDays);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  async getSubscriptionById(@Param('id') id: string) {
    return this.subscriptionsService.getSubscriptionById(id);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get all subscriptions for a tenant' })
  async getTenantSubscriptions(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.getTenantSubscriptions(tenantId);
  }

  @Get('tenant/:tenantId/active')
  @ApiOperation({ summary: 'Get active subscription for a tenant' })
  async getActiveSubscription(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.getActiveSubscription(tenantId);
  }

  @Post(':id/renew')
  @ApiOperation({ summary: 'Renew a subscription' })
  async renewSubscription(@Param('id') id: string) {
    return this.subscriptionsService.renewSubscription(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  async cancelSubscription(@Param('id') id: string, @Body() dto: CancelSubscriptionDto) {
    return this.subscriptionsService.cancelSubscription(id, dto.immediate);
  }

  @Put(':id/upgrade')
  @ApiOperation({ summary: 'Upgrade subscription plan' })
  async upgradePlan(@Param('id') id: string, @Body() dto: UpgradePlanDto) {
    return this.subscriptionsService.upgradePlan(id, dto.newPlanId);
  }

  @Put(':id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update subscription status (admin)' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.subscriptionsService.updateSubscriptionStatus(id, status);
  }

  @Post('check-expired')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Check and expire subscriptions (admin/cron)' })
  async checkExpired() {
    return this.subscriptionsService.checkExpiredSubscriptions();
  }
}
