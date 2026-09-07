import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService, CheckoutDto } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'B2B Cart Checkout (Select Plan, apply GST & points discount)' })
  async checkout(@Request() req: any, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(req.user.id, dto);
  }

  @Post(':id/pay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate / Verify Payment Gateway callback (UPI / Card)' })
  async processPayment(
    @Param('id') id: string,
    @Body() body: { paymentId?: string; status?: 'SUCCESS' | 'FAILED' },
  ) {
    return this.ordersService.processPayment(id, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order history for tenant or user' })
  async getOrderHistory(
    @Query('tenantId') tenantId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.ordersService.getOrderHistory(tenantId, userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order details by ID' })
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Post(':id/initiate-razorpay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate Razorpay payment gateway order' })
  async initiateRazorpayOrder(@Param('id') id: string) {
    return this.ordersService.initiateRazorpayOrder(id);
  }
}
