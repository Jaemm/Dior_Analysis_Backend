import { ArgumentsHost, Catch, ConsoleLogger, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { CustomHttpExceptionResponse, HttpExceptionResponse } from './interface/http-exception.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new ConsoleLogger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse =
            exception instanceof HttpException ? (exception.getResponse() as HttpExceptionResponse | string) : undefined;

        const message =
            typeof exceptionResponse === 'string'
                ? exceptionResponse
                : Array.isArray(exceptionResponse?.message)
                  ? exceptionResponse.message[0]
                  : exceptionResponse?.message ||
                    (exception instanceof Error ? exception.message : 'Internal server error.');

        const errorMessage =
            typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exceptionResponse?.error ||
                  (status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error.' : message);

        const errorResponse = this.getErrorResponse(status, errorMessage, message, request);
        const errorLog = this.getErrorLog(errorResponse, request, exception);

        this.logger.error(JSON.stringify(errorLog));
        response.status(status).json(errorResponse);
    }

    private getErrorResponse = (
        status: HttpStatus,
        errorMessage: string,
        message: string,
        request: Request,
    ): CustomHttpExceptionResponse & { result_code: number } => {
        return {
            result_code: status,
            statusCode: status,
            error: errorMessage,
            message: message,
            path: request.url,
            method: request.method,
            timeStamp: new Date(),
        };
    };

    private getErrorLog = (
        errorResponse: CustomHttpExceptionResponse & { result_code: number },
        request: Request,
        exception: unknown,
    ) => {
        const payload: Record<string, unknown> = {
            method: request.method,
            path: request.url,
            status: errorResponse.statusCode,
            result_code: errorResponse.result_code,
            error: errorResponse.error,
            message: errorResponse.message,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        };

        const body = this.maskBody(request.body);
        if (body && Object.keys(body).length) {
            payload.body = body;
        }

        const exceptionName =
            exception instanceof Error
                ? exception.name
                : typeof exception === 'object' && exception !== null
                  ? exception.constructor?.name
                  : undefined;
        if (exceptionName) {
            payload.exception = exceptionName;
        }

        const stackPreview = this.getStackPreview(exception);
        if (stackPreview) {
            payload.at = stackPreview;
        }

        return payload;
    };

    private maskBody(body: unknown) {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return undefined;
        }

        const clone = { ...(body as Record<string, unknown>) };

        if (clone.password) clone.password = '***';
        if (clone.new_password) clone.new_password = '***';
        if (clone.refresh_token) clone.refresh_token = '***';
        if (clone.token) clone.token = '***';

        return clone;
    }

    private getStackPreview(exception: unknown): string | undefined {
        if (!(exception instanceof Error) || !exception.stack) {
            return undefined;
        }

        return exception.stack
            .split('\n')
            .slice(1)
            .map((line) => line.trim())
            .find((line) => line.startsWith('at '));
    }
}
