import crypto from 'node:crypto';
import type {
  DeliveryResult,
  NotificationJobPayload,
} from '@notification-platform/contracts';
import type { DeliveryProvider } from './delivery.provider.js';

export class SmsProvider implements DeliveryProvider {
  readonly name = 'sms-gateway-mock';

  async deliver(payload: NotificationJobPayload): Promise<DeliveryResult> {
    if (!payload.recipient.startsWith('+') && payload.recipient.length < 10) {
      return {
        success: false,
        provider: this.name,
        responseCode: 400,
        errorMessage: 'Invalid phone number format. Use E.164 format (e.g. +919876543210).',
      };
    }

    return {
      success: true,
      provider: this.name,
      responseCode: 200,
      providerMessageId: `sms_${crypto.randomBytes(6).toString('hex')}`,
    };
  }
}
