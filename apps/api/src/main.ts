
import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger, PinoLogger } from 'nestjs-pino';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-excedption.filters.js';

import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enterprise Notification Platform API')
    .setDescription('API documentation for the notification platform')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  app.useGlobalFilters(
    new HttpExceptionFilter(app.get(PinoLogger))
  );

  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`API running on port ${port}`, 'Bootstrap');
}

void bootstrap();
