import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  private generateApiKey(): string {
    return 'lp_' + crypto.randomBytes(24).toString('hex');
  }

  private generateApiSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async createTenant(businessId: string, data: {
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    gstNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    settings?: any;
    webhookUrl?: string;
  }) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existing) throw new BadRequestException('Tenant with this slug already exists');

    const apiKey = this.generateApiKey();
    const apiSecret = this.generateApiSecret();

    return this.prisma.tenant.create({
      data: {
        ...data,
        businessId,
        apiKey,
        apiSecret,
      },
      include: {
        business: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async getTenantById(id: string, businessId?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        business: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    if (businessId && tenant.businessId !== businessId) {
      throw new ForbiddenException('Access denied to this tenant');
    }

    return tenant;
  }

  async getTenantBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        business: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async getBusinessTenants(businessId: string) {
    return this.prisma.tenant.findMany({
      where: { businessId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTenant(id: string, businessId: string, data: Partial<{
    name: string;
    description: string;
    logo: string;
    settings: any;
    webhookUrl: string;
    isActive: boolean;
  }>) {
    const tenant = await this.getTenantById(id, businessId);
    
    return this.prisma.tenant.update({
      where: { id },
      data,
      include: {
        business: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async regenerateApiCredentials(id: string, businessId: string) {
    await this.getTenantById(id, businessId);

    const apiKey = this.generateApiKey();
    const apiSecret = this.generateApiSecret();

    return this.prisma.tenant.update({
      where: { id },
      data: { apiKey, apiSecret },
      select: { id: true, apiKey: true, apiSecret: true },
    });
  }

  async deleteTenant(id: string, businessId: string) {
    await this.getTenantById(id, businessId);

    const activeSubscriptions = await this.prisma.subscription.count({
      where: { tenantId: id, status: 'ACTIVE' },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException('Cannot delete tenant with active subscriptions');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async verifyApiKey(apiKey: string): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { apiKey },
      include: {
        business: {
          select: { id: true, email: true, role: true },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
        },
      },
    });

    if (!tenant || !tenant.isActive) {
      throw new ForbiddenException('Invalid or inactive API key');
    }

    return tenant;
  }
}
