import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TimingMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();

        // Wait for the request to complete
        res.on('finish', () => {
            const end = Date.now();
            const duration = end - start;
            console.log(`Request to ${req.method} ${req.url} took ${duration} ms`);
        });

        next();
    }
}
