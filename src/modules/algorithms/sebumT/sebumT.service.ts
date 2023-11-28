import { Injectable, Inject, HttpException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { MoistureDTO } from 'src/common/Dto/analysis/moisture.dto';

@Injectable()
export class SebumTService {
    constructor(private database: DatabaseService) {}

    async saveData(data: MoistureDTO, analyzedImageArgs: any, originalImageArgs: any, imageRecords: any) {
        const saveSql =
            'INSERT INTO measurements (batch_id, url, sys_url, hash, type_measurement_id, type_image_id, args, scores) values ($1, $2, $3, $4, $5, $6, $7, $8)';
        // const saveArgsSql = 'INSERT INTO keratin (batch_id, args) data ($1, $2)';
        const queries = [
            {
                variables: [
                    data.batch_id,
                    analyzedImageArgs.url,
                    analyzedImageArgs.sys_url,
                    analyzedImageArgs.hash,
                    9,
                    18,
                    JSON.stringify({ nth_analysis: imageRecords }),
                    null,
                ],
            },
            {
                variables: [
                    data.batch_id,
                    originalImageArgs.url,
                    originalImageArgs.sys_url,
                    originalImageArgs.hash,
                    9,
                    21,
                    JSON.stringify({ nth_analysis: imageRecords }),
                    JSON.stringify({
                        raw: data.raw,
                        score: data.score,
                    }),
                ],
            },
        ];

        for (let i = 0; i < queries.length; i++) {
            this.database.executeQuery(saveSql, queries[i].variables);
        }

        return 'saved';
    }
}

