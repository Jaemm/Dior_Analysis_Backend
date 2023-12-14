import { Global, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DatabaseOptions } from './databaseOptions';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { MyLogger } from 'src/config/Logger/logger.service';

config();

const configService = new ConfigService();

const combinedDatabasePoolFactory = async () => {
    const primaryPool = new Pool({
        user: configService.get('POSTGRES_USER'),
        host: configService.get('POSTGRES_HOST'),
        database: configService.get('POSTGRES_DB'),
        password: configService.get('POSTGRES_PASSWORD'),
        port: configService.get('POSTGRES_PORT'),
    });

    const secondPool = new Pool({
        user: configService.get('POSTGRES_USER'),
        host: configService.get('POSTGRES_HOST'),
        database: configService.get('POSTGRES_DIOR_DB'),
        password: configService.get('POSTGRES_PASSWORD_DIOR'),
        port: configService.get('POSTGRES_PORT'),
    });

    return { primaryPool, secondPool };
};
// @Injectable()
// @Global()
@Module({
    providers: [
        {
            provide: 'DATABASE_POOL',
            inject: [ConfigService],
            useFactory: combinedDatabasePoolFactory,
        },
        // {
        //     provide: 'DATABASE_POOL',
        //     inject: [ConfigService],
        //     useFactory: DiorDBPoolFactory,
        // },
        DatabaseService,
    ],
    exports: [DatabaseService],
})
export class DatabaseModule implements OnApplicationShutdown {
    private readonly logger = new MyLogger(DatabaseModule.name);

    constructor(private readonly moduleRef: ModuleRef) {}

    // onApplicationShutdown(signal?: string) {
    //     this.logger.log(`Shotting down ${signal}`);
    //     const pool = this.moduleRef.get('DATABASE_POOL') as Pool;
    //     return pool.end;
    // }

    onApplicationShutdown(signal?: string) {
        // Handle shutdown of both database pools if needed
        this.logger.log(`Shotting down ${signal}`);
        const combinedDatabasePool = this.moduleRef.get('DATABASE_POOL') as any;
        return Promise.all([combinedDatabasePool.primaryPool.end(), combinedDatabasePool.secondPool.end()]);
    }
}

