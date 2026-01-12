import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { ImagesModule } from './modules/images/images.module';
import { HistoryModule } from './modules/history/history.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductRecommendationModule } from './modules/productRecommendation/productRecommendation.module';
import { EmailModule } from './modules/email/email.module';
import { TimestampModule } from './modules/timestamp/timestamp.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/exceptions/exceptionHandling/allException.filter';
import { BullModule } from '@nestjs/bull';
import { AuthMiddleware } from './common/middleWare/authMiddlware/auth.middleware';
import { TimingMiddleware } from './common/middleWare/timingMiddleware/timing.middleware';

@Module({
    imports: [
        BullModule.forRoot({
            redis: { host: 'localhost', port: 6379 },
        }),
        BullModule.registerQueue({ name: 'dataSaving' }),

        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['env/.env'],
        }),

        // ✅ 기존 pg 기반 DB
        DatabaseModule,

        // ✅ Timestamp 전용 TypeORM Root (이게 빠져 있었음)
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST,
            port: Number(process.env.POSTGRES_PORT),
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DB,
            entities: [__dirname + '/modules/timestamp/*.entity{.ts,.js}'],
            synchronize: false, // ❗ 절대 true 금지
        }),

        // 기타 모듈
        ImagesModule,
        HistoryModule,
        AnalysisModule,
        CustomerModule,
        ProductRecommendationModule,
        EmailModule,

        // Timestamp (TypeORM 사용)
        TimestampModule,
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        AuthMiddleware,
    ],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(TimingMiddleware).forRoutes('*');
        consumer
            .apply(AuthMiddleware)
            .exclude(
                { path: 'web-result/(.*)', method: RequestMethod.ALL },
                { path: 'image/(.*)', method: RequestMethod.GET },
                { path: 'questions/(.*)', method: RequestMethod.ALL },
                { path: 'timestamp', method: RequestMethod.ALL },
                { path: 'timestamp/(.*)', method: RequestMethod.ALL },
            )
            .forRoutes('*');
    }
}
