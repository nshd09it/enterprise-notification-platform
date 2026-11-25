
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'debug',
        autoLogging: true,

        genReqId: (request) =>
          request.headers['x-request-id']?.toString() ??
          crypto.randomUUID(),

        ...(process.env.NODE_ENV !== 'production'
          ? {
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                },
              },
            }
          : {}),
      },
    }),
  ],
  exports: [LoggerModule],
})
export class AppLoggingModule {}
