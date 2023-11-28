import { Inject, Injectable } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import { MyLogger } from 'src/config/Logger/logger.service';
import { CONNECTION_POOL } from './database.module-definition';

@Injectable()
export class DatabaseService {
    private readonly logger = new MyLogger(DatabaseService.name);

    constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

    executeQuery(queryText: string, values: any[] = []): Promise<any> {
        this.logger.debug(`Executing query: ${queryText} (${values})`);
        return this.pool.query(queryText, values).then((result: QueryResult) => {
            this.logger.debug(`Executed query, result size ${result.rows.length}`);
            return result.rows;
        });
    }

    async runQuery(query: string, params?: unknown[]) {
        return this.pool.query(query, params);
    }
}
