import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
@Injectable()
export class AuthMiddleware implements NestMiddleware {
    private readonly secretKey = process.env.ACCESS_TOKEN_SECRET;

    use(req: Request, res: Response, next: NextFunction) {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            // Token not provided, handle accordingly (e.g., return unauthorized response)
            return res.status(403).send({
                status: 10002,
                type: 'AuthenticationError',
                message: {
                    en: 'You are unauthorized, try refreshing the page.',
                },
            });
        }

        try {
            const decoded = jwt.verify(token, this.secretKey);

            console.log(decoded);
            // return decoded;
            // Do further verification or processing if needed
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).send({
                    status: 10000,
                    type: 'TokenExpiredError',
                    message: {
                        en: 'Your token is expired',
                    },
                });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(401).send({
                    status: 10001,
                    type: 'JsonWebTokenError',
                    message: {
                        en: 'Invalid access token',
                    },
                });
            } else if (err.name === 'NotBeforeError') {
                return res.status(401).send({
                    status: 10003,
                    type: 'JsonWebTokenError',
                    message: {
                        en: err.message,
                    },
                });
            }
            return res.status(403).send({
                status: 10002,
                type: 'AuthenticationError',
                message: {
                    en: 'You are unauthorized, try refreshing the page.',
                },
            });
        }
    }
}

