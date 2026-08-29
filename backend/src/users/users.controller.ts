import { Controller, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard, AdminGuard } from '../auth/jwt.guard';

export class UpdateProfileDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsDateString() birthday?: string;
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get('me/notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.getNotifications(req.user.id, page, limit);
  }

  @Get('me/referrals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user referral history' })
  async getReferrals(@Request() req: any) {
    return this.usersService.getReferrals(req.user.id);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users (admin)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tier', required: false })
  async listUsers(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string, @Query('tier') tier?: string) {
    return this.usersService.findAll(page, limit, search, tier);
  }
}
