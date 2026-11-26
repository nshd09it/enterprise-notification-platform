import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import {
  prisma,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '@notification-platform/database';
import {
  createNotificationQueue,
  enqueueNotification,
} from '@notification-platform/queue';
import type { CreateNotificationDto } from './dto/create-notification.dto.js';

@Injectable()
export class NotificationsService implements OnModuleDestroy {
  private readonly queue = createNotificationQueue();

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }

  async create(dto: CreateNotificationDto) {
    if (dto.idempotencyKey) {
      const existing = await prisma.notification.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: { attempts: true },
      });
      if (existing) {
        return existing;
      }
    }

    const notification = await prisma.notification.create({
      data: {
        channel: dto.channel as NotificationChannel,
        recipient: dto.recipient,
        subject: dto.subject ?? null,
        body: dto.body,
        priority: (dto.priority ?? 'NORMAL') as NotificationPriority,
        idempotencyKey: dto.idempotencyKey ?? null,
        metadata: dto.metadata ? (dto.metadata as object) : undefined,
        status: NotificationStatus.QUEUED,
      },
    });

    await enqueueNotification(this.queue, {
      notificationId: notification.id,
      channel: notification.channel,
      recipient: notification.recipient,
      subject: notification.subject,
      body: notification.body,
      metadata: (notification.metadata as Record<string, unknown> | null) ?? null,
      priority: notification.priority,
    });

    return notification;
  }

  async findAll(params: {
    status?: NotificationStatus;
    channel?: NotificationChannel;
    limit?: number;
  }) {
    const take = Math.min(Math.max(params.limit ?? 50, 1), 200);
    return prisma.notification.findMany({
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.channel ? { channel: params.channel } : {}),
      },
      include: {
        attempts: {
          orderBy: { attemptNumber: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async findOne(id: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        attempts: {
          orderBy: { attemptNumber: 'asc' },
        },
      },
    });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return notification;
  }

  async retry(id: string) {
    const notification = await this.findOne(id);
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.QUEUED,
        lastError: null,
      },
    });

    await enqueueNotification(
      this.queue,
      {
        notificationId: notification.id,
        channel: notification.channel,
        recipient: notification.recipient,
        subject: notification.subject,
        body: notification.body,
        metadata: (notification.metadata as Record<string, unknown> | null) ?? null,
        priority: notification.priority,
      },
      { jobId: `${notification.id}-retry-${Date.now()}` },
    );

    return updated;
  }

  async getStats() {
    const [total, delivered, failed, queued, processing, channelGroups] =
      await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({ where: { status: NotificationStatus.DELIVERED } }),
        prisma.notification.count({ where: { status: NotificationStatus.FAILED } }),
        prisma.notification.count({ where: { status: NotificationStatus.QUEUED } }),
        prisma.notification.count({ where: { status: NotificationStatus.PROCESSING } }),
        prisma.notification.groupBy({
          by: ['channel'],
          _count: { channel: true },
        }),
      ]);

    const byChannel: Record<string, number> = {
      EMAIL: 0,
      SMS: 0,
      PUSH: 0,
      WEBHOOK: 0,
    };
    for (const row of channelGroups) {
      byChannel[row.channel] = row._count.channel;
    }

    return {
      total,
      delivered,
      failed,
      queued,
      processing,
      byChannel,
    };
  }
}
