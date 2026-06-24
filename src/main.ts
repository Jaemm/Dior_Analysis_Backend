import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpException } from '@nestjs/common/exceptions';
import { HttpStatus } from '@nestjs/common/enums';
import * as tls from 'tls';

async function bootstrap() {
    const enableSwagger = process.env.OPEN_SWAGGER === 'true';
    const primaryHostname = process.env.PRIMARY_HOSTNAME;
    const secondaryHostname = process.env.SECONDARY_HOSTNAME;

    /* ================= HTTP ================= */
    const httpApp = await NestFactory.create(AppModule);
    await httpApp.listen(process.env.HTTP);

    /* ================= HTTPS ================= */
    const ssl = process.env.SSL === 'true';
    let httpsOptions: Record<string, unknown> | null = null;

    if (ssl) {
        const keyPath = process.env.CHOWIS_SSL_KEY_PATH || '';
        const certPath = process.env.CHOWIS_SSL_CERT_PATH || '';
        const key = fs.readFileSync(keyPath);
        const cert = fs.readFileSync(certPath);

        httpsOptions = {
            key,
            cert,
            SNICallback: (servername: string, cb: Function) => {
                const secureContext = tls.createSecureContext({ key, cert });

                if (servername === primaryHostname || servername === secondaryHostname) {
                    cb(null, secureContext);
                    return;
                }

                cb(null, secureContext);
            },
        };
    }

    /* ================= HTTPS APP ================= */
    const app = await NestFactory.create(AppModule, {
        httpsOptions,
        rawBody: true,
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    const port = Number(process.env.PORT) || 3000;
    const hostname = process.env.HOSTNAME || 'localhost';

    /* ================= Swagger ================= */
    if (enableSwagger) {
        const config = new DocumentBuilder()
            .setTitle('DIOR CNDP SKIN')
            .setDescription('<b>HOST</b><br><br>Deployment-specific hosts are configured through environment variables.')
            .setVersion('2.0.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'Token',
                },
                'access-token',
            )
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('docs', app, document);
    }

    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            exceptionFactory: (e) => {
                throw new HttpException(e[0].constraints, HttpStatus.BAD_REQUEST);
            },
        }),
    );

    app.enableCors();
    app.enableShutdownHooks();

    await app.listen(port, hostname, () => {
        const address = 'http' + (ssl ? 's' : '') + '://' + hostname + ':' + port + '/';
        Logger.log('Listening at ' + address);
    });
}

bootstrap();
