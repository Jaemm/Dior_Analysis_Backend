import { Injectable, Inject, HttpException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { BatchAnalysisService } from 'src/modules/analysis/batchAnalysis/batchAnalysis.service';

@Injectable()
export class MoistureUService {
    constructor(private database: DatabaseService) {}

    saveData(data: AlgoAnalysisDTO) {
        const saveSql =
            'INSERT INTO measurements (batch_id, type_measurement_id, type_image_id, scores) values ($1, $2, $3, $4)';
        const queries = [data.batch_id, 12, 21, JSON.stringify(data)];

        this.database.executeQuery(saveSql, queries);

        return data;
    }
}

