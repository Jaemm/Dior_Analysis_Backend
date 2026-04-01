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

    /* ================= HTTP ================= */
    const httpApp = await NestFactory.create(AppModule);
    await httpApp.listen(process.env.HTTP);

    /* ================= HTTPS (기존 + 신규 도메인) ================= */
    const ssl = process.env.SSL === 'true';
    let httpsOptions: Record<string, unknown> | null = null;

    if (ssl) {
        // 기본 인증서
        const chowisKey = fs.readFileSync(process.env.CHOWIS_SSL_KEY_PATH || '');
        const chowisCert = fs.readFileSync(process.env.CHOWIS_SSL_CERT_PATH || '');

        // 신규 도메인 인증서
        const choicedxKey = fs.readFileSync(process.env.CHOICEDX_SSL_KEY_PATH || '');
        const choicedxCert = fs.readFileSync(process.env.CHOICEDX_SSL_CERT_PATH || '');

        const choicedxContext = tls.createSecureContext({
            key: choicedxKey,
            cert: choicedxCert,
        });

        httpsOptions = {
            // fallback (필수)
            key: chowisKey,
            cert: chowisCert,

            SNICallback: (servername: string, cb: Function) => {
                if (servername === 'dior-analysis.choicedx.kr') {
                    cb(null, choicedxContext);
                } else {
                    cb(
                        null,
                        tls.createSecureContext({
                            key: chowisKey,
                            cert: chowisCert,
                        }),
                    );
                }
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
            .setDescription(
                '<b>HOST</b><br><br>' +
                    '<b>STAGING SERVER</b>: https://staging.chowis.cloud:4800<br><br>' +
                    '<b>CHOWIS SERVER</b>: https://dior-analysis.chowis.cloud:4800<br><br>' +
                    '<b>choicedx SERVER</b>: https://dior-analysis.choicedx.kr:4800<br><br>',
            )
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
