import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class BatchAnalysisService {
    constructor(private database: DatabaseService) {}

    async insertInAnalysis(customer_id: any, analysis_time: any, args: any) {
        try {
            const insert = await this.database.executeQuery(`
              INSERT INTO analysis (customer_id, analysis_time, args) 
              values (${customer_id}, to_timestamp('${analysis_time}', 'YYYY-MM-DD HH24:MI:SS'), '${args}') RETURNING *
            `);

            console.log(insert);

            // console.log("insert result", insert['rows'][0]['batch_id']);
            return insert[0]['batch_id'];
        } catch (e) {
            console.log(e);
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
            console.log('check', e);
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

