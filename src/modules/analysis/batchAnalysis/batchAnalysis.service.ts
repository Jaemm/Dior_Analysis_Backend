import { ConsoleLogger, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class BatchAnalysisService {
    private readonly logger = new ConsoleLogger(BatchAnalysisService.name);

    constructor(private database: DatabaseService) {}

    async insertInAnalysis(customer_id: any, analysis_time: any, args: any) {
        try {
            const insert = await this.database.executeQuery(`
              INSERT INTO analysis (customer_id, analysis_time, args) 
              values (${customer_id}, to_timestamp('${analysis_time}', 'YYYY-MM-DD HH24:MI:SS'), '${args}') RETURNING *
            `);
            return insert[0]['batch_id'];
        } catch (e) {
            this.logger.error(`[insertInAnalysis] ${e instanceof Error ? e.message : e}`);
            throw new InternalServerErrorException('Failed to insert analysis batch.');
        }
    }

    async updateEnvironment(batch_id: number, environment: any) {
        try {
            let data = JSON.stringify(environment);

            const update = `
                UPDATE analysis
                SET args = $1
                WHERE batch_id = $2
            `;

            await this.database.executeQuery(update, [data, batch_id]);
            return 'Update successful'; // Or any success message
        } catch (e) {
            this.logger.error(`[updateEnvironment] ${e instanceof Error ? e.message : e}`);
            throw new InternalServerErrorException('Failed to update batch environment.');
        }
    }

    async deleleBatch(batch_id: number) {
        const result = await this.database.executeQuery(
            `DELETE FROM analysis
            WHERE batch_id = ${batch_id};`,
        );

        return result;
    }

    //
}
