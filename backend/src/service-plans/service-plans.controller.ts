import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';
import { ServicePlansService } from './service-plans.service';
import { AdminGuard } from '../auth/jwt.guard';

class CreateServicePlanDto {
  @IsString() name: string;
  @IsString() slug: string;
  @IsString() description: string;
  @IsObject() features: any;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsString() billingCycle?: string;
  @IsOptional() @IsNumber() maxUsers?: number;
  @IsOptional() @IsNumber() maxTenants?: number;
  @IsOptional() @IsNumber() apiRateLimit?: number;
  @IsOptional() @IsObject() metadata?: any;
}

class UpdateServicePlanDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsObject() features?: any;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsString() billingCycle?: string;
  @IsOptional() @IsNumber() maxUsers?: number;
  @IsOptional() @IsNumber() maxTenants?: number;
  @IsOptional() @IsNumber() apiRateLimit?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsObject() metadata?: any;
}

@ApiTags('Service Plans')
@Controller('service-plans')
export class ServicePlansController {
  constructor(private servicePlansService: ServicePlansService) {}

  @Get()
  @ApiOperation({ summary: 'Get all service plans' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async getAllPlans(@Query('includeInactive') includeInactive?: string) {
    return this.servicePlansService.getAllPlans(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service plan by ID' })
  async getPlanById(@Param('id') id: string) {
    return this.servicePlansService.getPlanById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get service plan by slug' })
  async getPlanBySlug(@Param('slug') slug: string) {
    return this.servicePlansService.getPlanBySlug(slug);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service plan (admin)' })
  async createPlan(@Body() dto: CreateServicePlanDto) {
    return this.servicePlansService.createPlan(dto);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service plan (admin)' })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdateServicePlanDto) {
    return this.servicePlansService.updatePlan(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a service plan (admin)' })
  async deletePlan(@Param('id') id: string) {
    return this.servicePlansService.deletePlan(id);
  }

  @Get(':id/subscriptions/count')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription count for a plan (admin)' })
  async getSubscriptionCount(@Param('id') id: string) {
    const count = await this.servicePlansService.getSubscriptionCount(id);
    return { planId: id, activeSubscriptions: count };
  }
}
