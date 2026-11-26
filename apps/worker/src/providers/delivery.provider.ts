import type {
  DeliveryResult,
  NotificationJobPayload,
} from '@notification-platform/contracts';

export interface DeliveryProvider {
  readonly name: string;
  deliver(payload: NotificationJobPayload): Promise<DeliveryResult>;
}
