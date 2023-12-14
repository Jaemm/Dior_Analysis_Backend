import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import * as fs from 'fs';
import { CustomHttpExceptionResponse, HttpExceptionResponse } from './interface/http-exception.interface';
import { QueryFailedError } from 'typeorm';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch(QueryFailedError)
export class TypeORMExceptionFilter extends BaseExceptionFilter {
    catch(exception: QueryFailedError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        let errorMessage: string;

        const errorResponse_: any = 'Database error occurred';

        errorMessage = 'INTERNAL SERVER ERROR';

        const message = (errorResponse_ as HttpExceptionResponse)?.error || exception?.message;

        const errorResponse = this.getErrorResponse(status, errorMessage, message, request);

        const errorLog = this.getErrorLog(errorResponse, message, request, exception);
        this.writeErrorLogToFile(errorLog);
        response.status(status).json(errorResponse);
    }

    private getErrorResponse = (
        status: HttpStatus,
        errorMessage: string,
        message: string,
        request: Request,
    ): CustomHttpExceptionResponse => ({
        statusCode: status,
        error: errorMessage,
        message: message,
        path: request.url,
        method: request.method,
        timeStamp: new Date(),
    });

    private getErrorLog = (
        errorResponse: CustomHttpExceptionResponse,
        message: string,
        request: Request,
        exception: unknown,
    ): string => {
        const { statusCode, error } = errorResponse;
        const { method, url } = request;
        const kr_time = new Date().toLocaleString();
        const errorLog = `Response Code: ${statusCode} - Method: ${method} - URL: ${url}\n\n
        detail: ${JSON.stringify(errorResponse)}\n
        time: ${JSON.stringify(kr_time)}\n
        message: ${JSON.stringify(message)}\n
        ${exception instanceof HttpException ? exception.stack : error}\n`;
        return errorLog;
    };

    private writeErrorLogToFile = (errorLog: string): void => {
        fs.appendFile('error.log', errorLog, 'utf8', (err) => {
            if (err) throw err;
        });
    };
}

