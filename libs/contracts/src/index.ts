export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK';

export type NotificationStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'DELIVERED'
  | 'FAILED';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface NotificationJobPayload {
  notificationId: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string | null;
  body: string;
  metadata?: Record<string, unknown> | null;
  priority: NotificationPriority;
}

export interface DeliveryResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  responseCode?: number;
  errorMessage?: string;
}

export interface NotificationStatsResponse {
  total: number;
  delivered: number;
  failed: number;
  queued: number;
  processing: number;
  byChannel: Record<NotificationChannel, number>;
}
