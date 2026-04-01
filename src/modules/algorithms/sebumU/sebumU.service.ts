import { ConsoleLogger, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { MoistureDTO } from 'src/common/Dto/analysis/moisture.dto';

@Injectable()
export class SebumUService {
    private readonly logger = new ConsoleLogger(SebumUService.name);

    constructor(private database: DatabaseService) {}

    async saveData(data: MoistureDTO, analyzedImageArgs: any, originalImageArgs: any, imageRecords: any) {
        // const analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'sebumU');
        this.logger.debug(`[saveData] batch_id=${data.batch_id}`);
        // const originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'sebumU');

        const saveSql =
            'INSERT INTO measurements (batch_id, url, sys_url, hash, type_measurement_id, type_image_id, args, scores) values ($1, $2, $3, $4, $5, $6, $7, $8)';
        const queries = [
            {
                variables: [
                    data.batch_id,
                    analyzedImageArgs.url,
                    analyzedImageArgs.sys_url,
                    analyzedImageArgs.hash,
                    5,
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
                    5,
                    21,
                    JSON.stringify({ nth_analysis: imageRecords }),
                    JSON.stringify({
                        raw: data.raw,
                        score: data.score,
                        skinAge: data.skinAge,
                        skinCondition: data.skinCondition,
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
