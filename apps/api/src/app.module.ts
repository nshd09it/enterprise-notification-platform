
import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { AppLoggingModule } from './logging/logging.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [
    AppConfigModule,
    AppLoggingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
