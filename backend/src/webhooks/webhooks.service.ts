import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto-js';
import { nanoid } from 'nanoid';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async createEndpoint(dto: { url: string; events: string[] }) {
    const secret = `whsec_${nanoid(32)}`;
    return this.prisma.webhookEndpoint.create({ data: { url: dto.url, events: dto.events, secret } });
  }

  async updateEndpoint(id: string, dto: { url?: string; events?: string[]; isActive?: boolean }) {
    return this.prisma.webhookEndpoint.update({ where: { id }, data: dto });
  }

  async deleteEndpoint(id: string) {
    return this.prisma.webhookEndpoint.delete({ where: { id } });
  }

  async listEndpoints() {
    return this.prisma.webhookEndpoint.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getEndpointLogs(endpointId: string, limit = 50) {
    return this.prisma.webhookLog.findMany({
      where: { endpointId },
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  }

  // Dispatch webhook to all matching endpoints
  async dispatch(event: string, payload: any) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { isActive: true, events: { has: event } },
    });

    const results = await Promise.allSettled(
      endpoints.map(ep => this.sendWebhook(ep, event, payload)),
    );

    return { event, endpointsNotified: endpoints.length, results: results.map(r => r.status) };
  }

  private async sendWebhook(endpoint: any, event: string, payload: any) {
    const timestamp = Date.now().toString();
    const body = JSON.stringify({ event, timestamp, data: payload });
    const signature = crypto.HmacSHA256(body, endpoint.secret).toString();

    let statusCode: number | null = null;
    let responseText: string | null = null;

    try {
      // In production: Use fetch/axios with timeout and retry
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': timestamp,
          'X-Webhook-Event': event,
        },
        body,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
      statusCode = response.status;
      responseText = await response.text();
    } catch (error: any) {
      responseText = error.message;
    }

    // Log the attempt
    await this.prisma.webhookLog.create({
      data: { endpointId: endpoint.id, event, payload, statusCode, response: responseText?.substring(0, 500), attempts: 1 },
    });

    return { endpointId: endpoint.id, statusCode };
  }
}
