import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ImagesModule } from './modules/images/images.module';
import { HistoryModule } from './modules/history/history.module';
import { FileUploaddModule } from './common/FileUpload/fileUpload.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/exceptions/exceptionHandling/allException.filter';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { CustomerModule } from './modules/customer/customer.module';
import { BullModule } from '@nestjs/bull';
import { AuthMiddleware } from './common/middleWare/authMiddlware/auth.middleware';
import { TimingMiddleware } from './common/middleWare/timingMiddleware/timing.middleware';

@Module({
    imports: [
        BullModule.forRoot({
            redis: {
                host: 'localhost',
                port: 6379,
            },
        }),
        BullModule.registerQueue({
            name: 'dataSaving',
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['env/.env'],
        }),
        DatabaseModule,
        ImagesModule,
        HistoryModule,
        AnalysisModule,
        CustomerModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        AuthMiddleware,
        FileUploaddModule,
    ],
})
export class AppModule {
    // Timing MiddleWare
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(TimingMiddleware).forRoutes('*');
    }
}

