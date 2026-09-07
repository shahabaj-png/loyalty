import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

class CreateTenantDto {
  @IsString() name: string;
  @IsString() slug: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsObject() settings?: any;
  @IsOptional() @IsString() webhookUrl?: string;
}

class UpdateTenantDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsObject() settings?: any;
  @IsOptional() @IsString() webhookUrl?: string;
}

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  async createTenant(@Request() req: any, @Body() dto: CreateTenantDto) {
    return this.tenantsService.createTenant(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all my tenants' })
  async getMyTenants(@Request() req: any) {
    return this.tenantsService.getBusinessTenants(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async getTenantById(@Request() req: any, @Param('id') id: string) {
    return this.tenantsService.getTenantById(id, req.user.id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  async getTenantBySlug(@Param('slug') slug: string) {
    return this.tenantsService.getTenantBySlug(slug);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tenant' })
  async updateTenant(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.updateTenant(id, req.user.id, dto);
  }

  @Post(':id/regenerate-credentials')
  @ApiOperation({ summary: 'Regenerate API credentials' })
  async regenerateCredentials(@Request() req: any, @Param('id') id: string) {
    return this.tenantsService.regenerateApiCredentials(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate tenant' })
  async deleteTenant(@Request() req: any, @Param('id') id: string) {
    return this.tenantsService.deleteTenant(id, req.user.id);
  }
}
