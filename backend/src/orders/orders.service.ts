import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsNumber()
  @IsOptional()
  pointsToUse?: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  gstNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  pincode?: string;
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const plan = await this.prisma.servicePlan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException('Service plan not found');

    // Update Tenant GST / Address if provided
    if (dto.gstNumber || dto.address) {
      await this.prisma.tenant.update({
        where: { id: dto.tenantId },
        data: {
          gstNumber: dto.gstNumber || tenant.gstNumber,
          address: dto.address || tenant.address,
          city: dto.city || tenant.city,
          state: dto.state || tenant.state,
          pincode: dto.pincode || tenant.pincode,
        },
      });
    }

    const subtotal = plan.price;
    let pointsUsed = dto.pointsToUse || 0;
    
    // Max points usable cannot exceed available points
    if (pointsUsed > user.availablePoints) {
      pointsUsed = user.availablePoints;
    }

    // 100 points = ₹1 (or 100 paise depending on unit) -> 1 point = 1 rupee discount (100 paise)
    // Subtotal is in paise (e.g. 9900 = ₹99)
    const pointsDiscountPaise = pointsUsed * 100;
    const discount = Math.min(subtotal, pointsDiscountPaise);
    const total = Math.max(0, subtotal - discount);

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        tenantId: dto.tenantId,
        userId,
        items: [
          {
            type: 'SERVICE_PLAN_SUBSCRIPTION',
            planId: plan.id,
            planName: plan.name,
            billingCycle: plan.billingCycle,
            price: plan.price,
          },
        ],
        subtotal,
        discount,
        pointsUsed,
        pointsDiscount: discount,
        total,
        status: 'PENDING',
        paymentMethod: dto.paymentMethod || 'UPI',
        metadata: {
          planId: plan.id,
          billingCycle: plan.billingCycle,
        },
      },
    });

    return {
      order,
      summary: {
        orderNumber: order.orderNumber,
        subtotalRupees: subtotal / 100,
        discountRupees: discount / 100,
        pointsUsed,
        totalPayableRupees: total / 100,
        status: order.status,
      },
    };
  }

  async processPayment(orderId: string, paymentDetails: { paymentId?: string; status?: 'SUCCESS' | 'FAILED' }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 'COMPLETED') {
      return { message: 'Order is already paid', order };
    }

    const isSuccess = paymentDetails.status !== 'FAILED';
    const status = isSuccess ? 'COMPLETED' : 'FAILED';
    const paidAt = isSuccess ? new Date() : null;

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        paymentId: paymentDetails.paymentId || `PAY-${Date.now()}`,
        paidAt,
      },
    });

    if (isSuccess) {
      // 1. Deduct points used
      if (order.pointsUsed > 0) {
        await this.prisma.user.update({
          where: { id: order.userId },
          data: {
            availablePoints: { decrement: order.pointsUsed },
            totalPoints: { decrement: order.pointsUsed },
          },
        });

        await this.prisma.pointTransaction.create({
          data: {
            userId: order.userId,
            type: 'REDEEM',
            amount: -order.pointsUsed,
            balance: 0,
            description: `Used points for B2B Subscription Order #${order.orderNumber}`,
            source: 'B2B_CHECKOUT',
          },
        });
      }

      // 2. Award new points for purchase (10% cashback in points, minimum 10 points for subscription order)
      const calculatedPoints = Math.floor((order.total / 100) * 10);
      const pointsEarned = Math.max(10, calculatedPoints);
      if (pointsEarned > 0) {
        await this.prisma.user.update({
          where: { id: order.userId },
          data: {
            availablePoints: { increment: pointsEarned },
            totalPoints: { increment: pointsEarned },
            lifetimePoints: { increment: pointsEarned },
          },
        });

        await this.prisma.pointTransaction.create({
          data: {
            userId: order.userId,
            type: 'EARN',
            amount: pointsEarned,
            balance: 0,
            description: `Earned 10% Cashback for B2B Subscription Order #${order.orderNumber}`,
            source: 'B2B_CHECKOUT',
          },
        });
      }

      // 3. Provision / Activate Tenant Subscription
      const metadata: any = order.metadata || {};
      const planId = metadata.planId;
      if (planId) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await this.prisma.subscription.create({
          data: {
            tenantId: order.tenantId,
            planId,
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            orders: { connect: { id: order.id } },
          },
        });
      }
    }

    return {
      message: isSuccess ? 'Payment successful and subscription activated' : 'Payment failed',
      order: updatedOrder,
    };
  }

  async getOrderHistory(tenantId?: string, userId?: string) {
    return this.prisma.order.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(userId ? { userId } : {}),
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        tenant: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async initiateRazorpayOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const razorpayOrderId = `rzp_order_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_loyalty_platform_123';

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId,
      keyId,
      amountPaise: order.total,
      currency: 'INR',
      notes: {
        tenantId: order.tenantId,
        userId: order.userId,
      },
    };
  }
}
