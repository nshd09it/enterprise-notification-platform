import crypto from 'node:crypto';
import type {
  DeliveryResult,
  NotificationJobPayload,
} from '@notification-platform/contracts';
import type { DeliveryProvider } from './delivery.provider.js';

export class PushProvider implements DeliveryProvider {
  readonly name = 'fcm-push-mock';

  async deliver(payload: NotificationJobPayload): Promise<DeliveryResult> {
    if (!payload.recipient || payload.recipient.trim().length < 6) {
      return {
        success: false,
        provider: this.name,
        responseCode: 400,
        errorMessage: 'Invalid device push token.',
      };
    }

    return {
      success: true,
      provider: this.name,
      responseCode: 200,
      providerMessageId: `push_${crypto.randomBytes(6).toString('hex')}`,
    };
  }
}
