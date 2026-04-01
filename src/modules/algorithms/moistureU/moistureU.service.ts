import { ConsoleLogger, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';

@Injectable()
export class MoistureUService {
    private readonly logger = new ConsoleLogger(MoistureUService.name);

    constructor(private database: DatabaseService) {}

    saveData(data: AlgoAnalysisDTO) {
        this.logger.debug(`[saveData] batch_id=${data.batch_id}`);
        const saveSql =
            'INSERT INTO measurements (batch_id, type_measurement_id, type_image_id, scores) values ($1, $2, $3, $4)';
        const queries = [data.batch_id, 12, 21, JSON.stringify(data)];

        this.database.executeQuery(saveSql, queries);

        return data;
    }
}
