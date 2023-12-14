import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
// import { nestCsrf } from 'ncsrf';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpException, UnauthorizedException } from '@nestjs/common/exceptions';
import { HttpStatus } from '@nestjs/common/enums';
import { TypeORMExceptionFilter } from './common/exceptions/exceptionHandling/DBException.filter';
// const logStream = fs.createWriteStream('api.log', {
//   flags: 'a',
// });

async function bootstrap() {
    const enableSwagger = process.env.OPEN_SWAGGER === 'true';
    const httpApp = await NestFactory.create(AppModule);
    await httpApp.listen(process.env.HTTP);

    const ssl = process.env.SSL === 'true' ? true : false;
    let httpsOptions = null;
    if (ssl) {
        const keyPath = process.env.SSL_KEY_PATH || '';
        const certPath = process.env.SSL_CERT_PATH || '';
        httpsOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        };
    }
    const app = await NestFactory.create(AppModule, {
        httpsOptions,
        rawBody: true,
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    const port = Number(process.env.PORT) || 3000;
    const hostname = process.env.HOSTNAME || 'localhost';

    if (enableSwagger) {
        const config = new DocumentBuilder() //sensitivity scabs
            .setTitle('DIOR CNDP SKIN - VERSION 2')
            .setDescription(
                '<b>HOST</b><br><br> <b>STAGING SERVER</b>: https://staging.chowis.cloud:4411 <b> <br><br> PRODUCTION SERVER</b>: https://v2-api.chowis.cloud:4001<br><br>' +
                    '<b>ALGO LIST</b><br><br>' +
                    '1. pores<br> 2. sensitivity<br> 3. impurities<br> 4. wrinkles<br> 5. sebumU<br> 6. sebumT<br> 7. spots<br> 8. skintone<br> 9. shine<br> 10. keratin<br><br>' +
                    '<b>NOTE: </b><br> <b>1. /analysis/dataUpload</b><br>' +
                    '- All analyzed and original images should synchronize simultaneously for each (one) analysis.<br> <u><b>Example</b></u> if there are five original and analyzed images of wrinkles, the upload API should be invoked once, prompting a request (with as an array of images) to save all the images.<br><br>' +
                    '- It is recommended to save answers from the answers field /analysis/dataUpload instead of using /question/save API <br><br>' +
                    '- Use the id beside each analysis name in the list as algotithmId for data upload <br><br>' +
                    '<b>2. Remark</b><br>' +
                    '- This is newly refactored code intended to contain all the old APIs. However, it is possible to encounter some mismatches in the response body of certain APIs.',
            )
            .setVersion('2.0.0')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'Token' }, 'access-token')
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('docs', app, document);
    }
    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            exceptionFactory: (e) => {
                console.log('error', e);
                throw new HttpException(e[0].constraints, HttpStatus.BAD_REQUEST);
            },
        }),
    );
    // app.use(morgan('tiny', { stream: logStream }));
    app.useGlobalFilters(new TypeORMExceptionFilter());

    app.enableCors();
    app.enableShutdownHooks();
    await app.listen(port, hostname, () => {
        const address = 'http' + (ssl ? 's' : '') + '://' + hostname + ':' + port + '/';
        Logger.log('Listening at ' + address);
    });
}
bootstrap();

