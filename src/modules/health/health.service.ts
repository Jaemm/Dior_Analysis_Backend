import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class HealthService {
    constructor(private readonly databaseService: DatabaseService) {}

    async check() {
        const checkedAt = new Date().toISOString();
        const uptime = process.uptime();

        const [primaryDatabase, crmDatabase] = await Promise.all([
            this.checkDatabase(() => this.databaseService.executeQuery('SELECT 1 AS ok'), 'primary'),
            this.checkDatabase(() => this.databaseService.crmQuery('SELECT 1 AS ok'), 'crm'),
        ]);

        const isHealthy = primaryDatabase.status === 'up' && crmDatabase.status === 'up';

        return {
            status: isHealthy ? 'ok' : 'error',
            checkedAt,
            uptime,
            services: {
                api: {
                    status: 'up',
                },
                database: {
                    primary: primaryDatabase,
                    crm: crmDatabase,
                },
            },
        };
    }

    private async checkDatabase(query: () => Promise<unknown>, name: string) {
        try {
            await query();
            return {
                status: 'up',
                name,
            };
        } catch (error) {
            return {
                status: 'down',
                name,
                error: error instanceof Error ? error.message : 'Unknown database error',
            };
        }
    }
}
