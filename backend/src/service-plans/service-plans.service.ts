import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ServicePlansService {
  constructor(private prisma: PrismaService) {}

  async getAllPlans(includeInactive = false) {
    return this.prisma.servicePlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.servicePlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Service plan not found');
    return plan;
  }

  async getPlanBySlug(slug: string) {
    const plan = await this.prisma.servicePlan.findUnique({ where: { slug } });
    if (!plan) throw new NotFoundException('Service plan not found');
    return plan;
  }

  async createPlan(data: {
    name: string;
    slug: string;
    description: string;
    features: any;
    price: number;
    billingCycle?: string;
    maxUsers?: number;
    maxTenants?: number;
    apiRateLimit?: number;
    metadata?: any;
  }) {
    const existing = await this.prisma.servicePlan.findUnique({ where: { slug: data.slug } });
    if (existing) throw new BadRequestException('Plan with this slug already exists');

    return this.prisma.servicePlan.create({ data });
  }

  async updatePlan(id: string, data: Partial<{
    name: string;
    description: string;
    features: any;
    price: number;
    billingCycle: string;
    maxUsers: number;
    maxTenants: number;
    apiRateLimit: number;
    isActive: boolean;
    metadata: any;
  }>) {
    await this.getPlanById(id);
    return this.prisma.servicePlan.update({ where: { id }, data });
  }

  async deletePlan(id: string) {
    await this.getPlanById(id);
    
    const subscriptionCount = await this.prisma.subscription.count({
      where: { planId: id, status: 'ACTIVE' },
    });

    if (subscriptionCount > 0) {
      throw new BadRequestException('Cannot delete plan with active subscriptions');
    }

    return this.prisma.servicePlan.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getSubscriptionCount(planId: string) {
    return this.prisma.subscription.count({
      where: { planId, status: 'ACTIVE' },
    });
  }
}
