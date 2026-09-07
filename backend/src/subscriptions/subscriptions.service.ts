import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  private calculatePeriodEnd(billingCycle: string, startDate: Date): Date {
    const endDate = new Date(startDate);
    switch (billingCycle) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }
    return endDate;
  }

  async createSubscription(tenantId: string, planId: string, trialDays?: number) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const plan = await this.prisma.servicePlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) throw new NotFoundException('Service plan not found or inactive');

    const now = new Date();
    const currentPeriodStart = now;
    const currentPeriodEnd = this.calculatePeriodEnd(plan.billingCycle, now);
    const trialEndsAt = trialDays ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : undefined;

    return this.prisma.subscription.create({
      data: {
        tenantId,
        planId,
        status: trialDays ? 'TRIALING' : 'ACTIVE',
        currentPeriodStart,
        currentPeriodEnd,
        trialEndsAt,
      },
      include: {
        plan: true,
        tenant: {
          include: {
            business: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async getSubscriptionById(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        tenant: {
          include: {
            business: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }

  async getTenantSubscriptions(tenantId: string) {
    return this.prisma.subscription.findMany({
      where: { tenantId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveSubscription(tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      include: { plan: true },
    });
  }

  async renewSubscription(id: string) {
    const subscription = await this.getSubscriptionById(id);

    if (subscription.status === 'CANCELED') {
      throw new BadRequestException('Cannot renew a canceled subscription');
    }

    const now = new Date();
    const newPeriodEnd = this.calculatePeriodEnd(subscription.plan.billingCycle, now);

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: newPeriodEnd,
        trialEndsAt: null,
      },
      include: {
        plan: true,
        tenant: true,
      },
    });
  }

  async cancelSubscription(id: string, immediate = false) {
    const subscription = await this.getSubscriptionById(id);

    const updateData: any = {
      status: 'CANCELED',
      canceledAt: new Date(),
    };

    if (!immediate) {
      updateData.cancelAt = subscription.currentPeriodEnd;
    }

    return this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        plan: true,
        tenant: true,
      },
    });
  }

  async upgradePlan(id: string, newPlanId: string) {
    const subscription = await this.getSubscriptionById(id);
    const newPlan = await this.prisma.servicePlan.findUnique({ where: { id: newPlanId } });

    if (!newPlan || !newPlan.isActive) {
      throw new NotFoundException('New service plan not found or inactive');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: { planId: newPlanId },
      include: {
        plan: true,
        tenant: true,
      },
    });
  }

  async updateSubscriptionStatus(id: string, status: string) {
    await this.getSubscriptionById(id);

    return this.prisma.subscription.update({
      where: { id },
      data: { status: status as any },
      include: {
        plan: true,
        tenant: true,
      },
    });
  }

  async checkExpiredSubscriptions() {
    const now = new Date();
    
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'TRIALING'] },
        currentPeriodEnd: { lt: now },
      },
    });

    for (const subscription of expiredSubscriptions) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' },
      });
    }

    return { checked: expiredSubscriptions.length };
  }
}
