import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { PrismaService } from '../common/prisma.service';
import { AdminGuard } from '../auth/jwt.guard';

export class CreateProductDto {
  @IsString() name: string;
  @IsOptional() @IsString() slug?: string;
  @IsString() description: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsBoolean() status?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsBoolean() status?: boolean;
}

@ApiTags('Products / Software')
@Controller('products')
export class ProductsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all software products' })
  async list() {
    return this.prisma.product.findMany({
      include: { plans: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details by ID' })
  async get(@Param('id') id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { plans: true, subscriptions: true },
    });
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new software product (Super Admin)' })
  async create(@Body() dto: CreateProductDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        price: dto.price || 0,
        status: dto.status ?? true,
      },
    });
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update software product details' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a software product' })
  async delete(@Param('id') id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
