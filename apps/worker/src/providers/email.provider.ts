import nodemailer from 'nodemailer';
import type {
  DeliveryResult,
  NotificationJobPayload,
} from '@notification-platform/contracts';
import type { DeliveryProvider } from './delivery.provider.js';

export class EmailProvider implements DeliveryProvider {
  readonly name = 'smtp-nodemailer';
  private readonly transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: process.env.SMTP_SECURE === 'true',
      ...(process.env.SMTP_USER
        ? {
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS ?? '',
            },
          }
        : {}),
    });
  }

  async deliver(payload: NotificationJobPayload): Promise<DeliveryResult> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'notifications@enterprise.local',
        to: payload.recipient,
        subject: payload.subject ?? 'Notification',
        text: payload.body,
      });

      return {
        success: true,
        provider: this.name,
        providerMessageId: info.messageId,
        responseCode: 250,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        errorMessage: error instanceof Error ? error.message : 'SMTP delivery failed',
      };
    }
  }
}
