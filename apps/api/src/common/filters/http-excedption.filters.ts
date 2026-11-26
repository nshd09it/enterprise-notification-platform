import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import {Request, Response} from 'express';
import { PinoLogger } from 'nestjs-pino';
import { ApiErrorResponse } from '../interfaces/api-error-response.interface';
import { stat } from 'fs';
import path from 'path';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: PinoLogger<string>) {}
    catch(exception: any, host: ArgumentsHost): void {
        const context = host.switchToHttp();

        const request = context.getRequest<Request>();
        const response = context.getResponse<Response>();

        const isHttpException = exception instanceof HttpException;

        const statusCode = isHttpException ? exception.getStatus(): 
                            HttpStatus.INTERNAL_SERVER_ERROR;

        const error = isHttpException ? exception.name : 'Internal Server Error';

        const exceptionResponse = isHttpException ? exception.getResponse() : undefined;

        const message  = isHttpException && typeof exceptionResponse === 'object'
                            ? (exceptionResponse as { message?: string | string[] }).message ??
                            exception.message : isHttpException ? exception.message : 'An unexpected error occured';

        const errorResponse: ApiErrorResponse = {
            success: false,
            statusCode,
            error,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        
        if(statusCode >= 500){
            this.logger.error({
                err: exception,
                path: request.url,
                method: request.method,
                statusCode
            })
        }else{
            this.logger.warn(
                {
                    path: request.url,
                    method: request.method,
                    statusCode
                },
                'HTTP request exception',
            );
        }
        response.status(statusCode).json(errorResponse);
    }
}
