import { Injectable, Inject, HttpException, ConsoleLogger, BadRequestException } from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class QuestionsService {
    constructor(private database: DatabaseService) {}

    async getAnswerList(batch_id: string | number) {
        const sql = `select * from questionnaire where batch_id = $1;`;
        const results = await this.database.executeQuery(sql, [batch_id]);

        return results.rows || [];
    }

    async saveAnswerList(batch_id: number | string, answers: string, args: any) {
        const sql = `insert into questionnaire (batch_id, answers, args) values ($1, $2, $3) returning *;`;
        const results = await this.database.executeQuery(sql, [batch_id, answers, args]);

        return results || [];
    }
}

