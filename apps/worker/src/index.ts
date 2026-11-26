import 'dotenv/config';
import { Worker, type Job } from 'bullmq';
import pino from 'pino';
import type {
  NotificationChannel,
  NotificationJobPayload,
} from '@notification-platform/contracts';
import { prisma, NotificationStatus } from '@notification-platform/database';
import {
  NOTIFICATION_QUEUE_NAME,
  createDeadLetterQueue,
  getBullConnectionOptions,
} from '@notification-platform/queue';
import type { DeliveryProvider } from './providers/delivery.provider.js';
import { EmailProvider } from './providers/email.provider.js';
import { WebhookProvider } from './providers/webhook.provider.js';
import { SmsProvider } from './providers/sms.provider.js';
import { PushProvider } from './providers/push.provider.js';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  name: 'notification-worker',
});

const providers: Record<NotificationChannel, DeliveryProvider> = {
  EMAIL: new EmailProvider(),
  WEBHOOK: new WebhookProvider(),
  SMS: new SmsProvider(),
  PUSH: new PushProvider(),
};

const connection = getBullConnectionOptions();
const dlq = createDeadLetterQueue(connection);

async function processJob(job: Job<NotificationJobPayload>) {
  const payload = job.data;
  const attemptNumber = job.attemptsMade + 1;
  const startedAt = Date.now();

  logger.info(
    { jobId: job.id, notificationId: payload.notificationId, channel: payload.channel, attemptNumber },
    'Processing notification delivery',
  );

  await prisma.notification.update({
    where: { id: payload.notificationId },
    data: {
      status: NotificationStatus.PROCESSING,
      attemptsCount: attemptNumber,
    },
  });

  const provider = providers[payload.channel];
  const result = await provider.deliver(payload);
  const durationMs = Date.now() - startedAt;

  await prisma.notificationDeliveryAttempt.create({
    data: {
      notificationId: payload.notificationId,
      attemptNumber,
      provider: result.provider,
      success: result.success,
      providerMessageId: result.providerMessageId ?? null,
      responseCode: result.responseCode ?? null,
      errorMessage: result.errorMessage ?? null,
      durationMs,
    },
  });

  if (!result.success) {
    const maxAttempts = job.opts.attempts ?? 4;
    const isFinalAttempt = attemptNumber >= maxAttempts;

    await prisma.notification.update({
      where: { id: payload.notificationId },
      data: {
        status: isFinalAttempt
          ? NotificationStatus.FAILED
          : NotificationStatus.QUEUED,
        lastError: result.errorMessage ?? 'Delivery failed',
      },
    });

    if (isFinalAttempt) {
      await dlq.add('dead-letter', {
        ...payload,
        failedReason: result.errorMessage ?? 'Exhausted max delivery attempts',
      });
    }

    throw new Error(result.errorMessage ?? 'Notification delivery failed');
  }

  await prisma.notification.update({
    where: { id: payload.notificationId },
    data: {
      status: NotificationStatus.DELIVERED,
      deliveredAt: new Date(),
      lastError: null,
    },
  });

  logger.info(
    { notificationId: payload.notificationId, providerMessageId: result.providerMessageId, durationMs },
    'Notification delivered successfully',
  );
}

const worker = new Worker<NotificationJobPayload>(
  NOTIFICATION_QUEUE_NAME,
  processJob,
  {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 10),
  },
);

worker.on('failed', (job, err) => {
  logger.error(
    { jobId: job?.id, notificationId: job?.data?.notificationId, err: err.message },
    'Job failed',
  );
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down worker gracefully...');
  await worker.close();
  await dlq.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

logger.info(
  { queue: NOTIFICATION_QUEUE_NAME, concurrency: Number(process.env.WORKER_CONCURRENCY ?? 10) },
  'Notification worker started and listening for jobs',
);
