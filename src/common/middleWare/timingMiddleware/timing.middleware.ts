import { ConsoleLogger, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

class NoTimestampConsoleLogger extends ConsoleLogger {
    protected formatMessage(
        logLevel: 'log' | 'error' | 'warn' | 'debug' | 'verbose',
        message: unknown,
        pidMessage: string,
        formattedLogLevel: string,
        contextMessage: string,
        timestampDiff: string,
    ): string {
        const output = this.stringifyMessage(message, logLevel);
        pidMessage = this.colorize(pidMessage, logLevel);
        formattedLogLevel = this.colorize(formattedLogLevel, logLevel);
        return `${pidMessage}${formattedLogLevel} ${contextMessage}${output}${timestampDiff}\n`;
    }
}

@Injectable()
export class TimingMiddleware implements NestMiddleware {
    private readonly logger = new NoTimestampConsoleLogger(TimingMiddleware.name);
    private readonly skippedPathPrefixes = ['/metrics', '/health', '/docs', '/docs-json', '/favicon.ico'];

    private isErrorStatus(statusCode: number): boolean {
        return statusCode >= 400;
    }

    private shouldSkipLogging(req: Request, statusCode: number): boolean {
        if (this.isErrorStatus(statusCode)) {
            return true;
        }

        if (req.method === 'OPTIONS') {
            return true;
        }

        const path = req.path || req.originalUrl || '';
        return this.skippedPathPrefixes.some((prefix) => path.startsWith(prefix));
    }

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

    private extractLocale(req: Request) {
        const raw = req.headers['x-local'] || req.headers['x-locale'] || req.headers['x-chowis-locale'];

        if (!raw) return { raw: undefined, normalized: undefined };

        const value = Array.isArray(raw) ? raw[0] : raw;

        return {
            raw: value,
            normalized: value.toLowerCase(),
        };
    }

    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        const { method, originalUrl } = req;
        const ip = req.ip;
        const userAgent = req.get('user-agent') || '';
        const locale = this.extractLocale(req);

        res.on('finish', () => {
            const duration = Date.now() - start;

            if (this.shouldSkipLogging(req, res.statusCode)) {
                return;
            }

            const logPayload: Record<string, unknown> = {
                method,
                path: originalUrl,
                status: res.statusCode,
                durationMs: duration,
                ip,
                locale: locale.normalized ?? '-',
                userAgent: userAgent || '-',
            };

            const body = this.maskBody(req.body);
            if (body && Object.keys(body).length) {
                logPayload.body = body;
            }

            const log = this.isErrorStatus(res.statusCode)
                ? this.logger.error.bind(this.logger)
                : this.logger.log.bind(this.logger);

            log(JSON.stringify(logPayload));
        });

        next();
    }
}
