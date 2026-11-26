import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger, PinoLogger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-excedption.filters.js';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const pinoLogger = await app.resolve(PinoLogger);
  app.useGlobalFilters(new HttpExceptionFilter(pinoLogger));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enterprise Notification Platform API')
    .setDescription('Multi-channel notification ingestion, queueing, and delivery tracking API')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  await app.listen(port);
}

void bootstrap();
