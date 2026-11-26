import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { AppLoggingModule } from './logging/logging.module.js';
import { HealthController } from './health/health.controller.js';
import { NotificationsModule } from './notifications/notifications.module.js';

@Module({
  imports: [AppConfigModule, AppLoggingModule, NotificationsModule],
  controllers: [HealthController],
})
export class AppModule {}
