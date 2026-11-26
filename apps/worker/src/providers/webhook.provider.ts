import crypto from 'node:crypto';
import type {
  DeliveryResult,
  NotificationJobPayload,
} from '@notification-platform/contracts';
import type { DeliveryProvider } from './delivery.provider.js';

export class WebhookProvider implements DeliveryProvider {
  readonly name = 'http-webhook';

  async deliver(payload: NotificationJobPayload): Promise<DeliveryResult> {
    const body = JSON.stringify({
      notificationId: payload.notificationId,
      subject: payload.subject,
      body: payload.body,
      metadata: payload.metadata ?? {},
      timestamp: new Date().toISOString(),
    });

    const secret = process.env.WEBHOOK_SIGNING_SECRET ?? 'local-dev-secret';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(payload.recipient, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Notification-Id': payload.notificationId,
          'X-Webhook-Signature': `sha256=${signature}`,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          success: false,
          provider: this.name,
          responseCode: response.status,
          errorMessage: `Webhook endpoint returned HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        provider: this.name,
        responseCode: response.status,
        providerMessageId: response.headers.get('x-request-id') ?? payload.notificationId,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        errorMessage: error instanceof Error ? error.message : 'Webhook request failed',
      };
    }
  }
}
