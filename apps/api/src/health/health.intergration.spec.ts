
import {
  Controller,
  Get,
  INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger, PinoLogger } from 'nestjs-pino';
import request from 'supertest';

import { AppModule } from '../app.module.js';
import { HttpExceptionFilter } from '../common/filters/http-excedption.filters.js';

@Controller('__test')
class TestFailureController {
  @Get('failure')
  simulateFailure(): never {
    throw new Error('Sensitive internal database detail');
  }
}

describe('API integration tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestFailureController],
    }).compile();

    app = moduleRef.createNestApplication({
      bufferLogs: true,
    });

    app.useLogger(app.get(Logger));

    const pinoLogger = await app.resolve(PinoLogger);
    app.useGlobalFilters(
      new HttpExceptionFilter(pinoLogger),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health should return 200', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'notification-api',
    });

    expect(response.body.timestamp).toBeDefined();
  });

  it('should return a standard 404 response', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/unknown')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 404,
      message: 'Cannot GET /api/v1/unknown',
      path: '/api/v1/unknown',
    });

    expect(response.body.timestamp).toBeDefined();
  });

  it('should hide internal details from unexpected errors', async () => {
    const response = await request(app.getHttpServer())
      .get('/__test/failure')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occured',
      path: '/__test/failure',
    });

    expect(JSON.stringify(response.body)).not.toContain(
      'Sensitive internal database detail',
    );
  });
});
