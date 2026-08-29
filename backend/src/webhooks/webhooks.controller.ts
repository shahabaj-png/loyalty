import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { WebhooksService } from './webhooks.service';
import { AdminGuard } from '../auth/jwt.guard';

class CreateWebhookDto {
  @IsString() url: string;
  @IsArray() events: string[];
}

class UpdateWebhookDto {
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsArray() events?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('Webhooks')
@Controller('webhooks')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'List webhook endpoints' })
  async list() { return this.webhooksService.listEndpoints(); }

  @Post()
  @ApiOperation({ summary: 'Create a webhook endpoint' })
  async create(@Body() dto: CreateWebhookDto) { return this.webhooksService.createEndpoint(dto); }

  @Put(':id')
  @ApiOperation({ summary: 'Update a webhook endpoint' })
  async update(@Param('id') id: string, @Body() dto: UpdateWebhookDto) { return this.webhooksService.updateEndpoint(id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  async delete(@Param('id') id: string) { return this.webhooksService.deleteEndpoint(id); }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get webhook delivery logs' })
  async getLogs(@Param('id') id: string, @Query('limit') limit = 50) { return this.webhooksService.getEndpointLogs(id, limit); }

  @Post('test')
  @ApiOperation({ summary: 'Send a test webhook event' })
  async test(@Body() body: { event: string; payload: any }) { return this.webhooksService.dispatch(body.event, body.payload); }
}
