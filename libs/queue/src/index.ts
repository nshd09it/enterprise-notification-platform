import { Queue, type ConnectionOptions, type JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';
import type {
  NotificationJobPayload,
  NotificationPriority,
} from '@notification-platform/contracts';

export const NOTIFICATION_QUEUE_NAME = 'notifications';
export const DEAD_LETTER_QUEUE_NAME = 'notifications-dlq';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export function getRedisConfig(): RedisConfig {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    ...(process.env.REDIS_PASSWORD
      ? { password: process.env.REDIS_PASSWORD }
      : {}),
  };
}

export function createRedisConnection(config: RedisConfig = getRedisConfig()): Redis {
  return new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    maxRetriesPerRequest: null,
  });
}

export function getBullConnectionOptions(
  config: RedisConfig = getRedisConfig(),
): ConnectionOptions {
  return {
    host: config.host,
    port: config.port,
    ...(config.password ? { password: config.password } : {}),
  };
}

const PRIORITY_MAP: Record<NotificationPriority, number> = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 5,
  LOW: 10,
};

export function createNotificationQueue(
  connection: ConnectionOptions = getBullConnectionOptions(),
): Queue<NotificationJobPayload> {
  return new Queue<NotificationJobPayload>(NOTIFICATION_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 4,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 2000 },
    },
  });
}

export function createDeadLetterQueue(
  connection: ConnectionOptions = getBullConnectionOptions(),
): Queue<NotificationJobPayload & { failedReason: string }> {
  return new Queue<NotificationJobPayload & { failedReason: string }>(
    DEAD_LETTER_QUEUE_NAME,
    { connection },
  );
}

export async function enqueueNotification(
  queue: Queue<NotificationJobPayload>,
  payload: NotificationJobPayload,
  overrides?: JobsOptions,
) {
  return queue.add(`deliver:${payload.channel.toLowerCase()}`, payload, {
    jobId: payload.notificationId,
    priority: PRIORITY_MAP[payload.priority] ?? 5,
    ...overrides,
  });
}
