import { Injectable, Inject, HttpException } from '@nestjs/common';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { DatabaseService } from 'src/database/database.service';
import * as celery from 'celery-node';
import { v4 as uuidv4 } from 'uuid';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import fs from 'fs';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { BatchAnalysisService } from 'src/modules/analysis/batchAnalysis/batchAnalysis.service';

@Injectable()
export class SkinToneDiorService {
    constructor(
        private database: DatabaseService,
        private S3Image: FileUploadService,
        private batchAnalysis: BatchAnalysisService,
    ) {}

    analysis(taskResponse: any, originalImageFirstArgs: any, originalImageSecondArgs: any) {
        // console.log("taskResponse", taskResponse)

        taskResponse = {
            ver: taskResponse.ver,
            shade: taskResponse.shade,
            raw1: taskResponse.raw1,
            raw2: taskResponse.raw2,
            averageR: taskResponse.averageR,
            averageG: taskResponse.averageG,
            averageB: taskResponse.averageB,
        };

        const retObj: any = {
            originalImageFirst: {
                id: originalImageFirstArgs.hash,
                url: originalImageFirstArgs.url,
            },

            originalImageSecond: {
                id: originalImageSecondArgs.hash,
                url: originalImageSecondArgs.url,
            },
        };

        taskResponse = { ...taskResponse, ...retObj };

        return taskResponse;
    }

    async saveData(
        data: AlgoAnalysisDTO,
        imageRecords: any,
        taskResponse: any,
        originalImageFirst: any,
        originalImageSecond: any,
        originalImageFirstArgs: any,
        originalImageSecondArgs: any,
    ) {
        const originalImageFirstSave = Buffer.from(originalImageFirst, 'base64');
        const originalImageSecondSave = Buffer.from(originalImageSecond, 'base64');

        delete taskResponse.img;
        delete taskResponse.err;

        taskResponse = {
            ...taskResponse,
        };

        const environment = {
            deviceModel: data.deviceModel,
            deviceOS: data.deviceOS,
            nth_analysis: imageRecords,
            lat: data.lat,
            long: data.long,
            temperature: data.temperature,
            humidity: data.humidity,
            uv_index: data.uv_index,
            positionNumber: data.positionNumber,
        };

        await this.batchAnalysis.updateEnvironment(data.batch_id, environment);
        const saveSql =
            'INSERT INTO measurements (batch_id, url, sys_url, hash, type_measurement_id, type_image_id, args, scores) values ($1, $2, $3, $4, $5, $6, $7, $8)';
        // const saveArgsSql = 'INSERT INTO keratin (batch_id, args) data ($1, $2)';
        const queries = [
            {
                variables: [
                    data.batch_id,
                    originalImageFirstArgs.url,
                    originalImageFirstArgs.sys_url,
                    originalImageFirstArgs.hash,
                    13,
                    21,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    JSON.stringify(taskResponse),
                ],
            },
            {
                variables: [
                    data.batch_id,
                    originalImageSecondArgs.url,
                    originalImageSecondArgs.sys_url,
                    originalImageSecondArgs.hash,
                    13,
                    21,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    JSON.stringify(taskResponse),
                ],
            },
        ];

        for (let i = 0; i < queries.length; i++) {
            this.database.executeQuery(saveSql, queries[i].variables);
        }

        await this.S3Image.uploadImage(originalImageFirstSave, originalImageFirstArgs.sys_url);
        await this.S3Image.uploadImage(originalImageSecondSave, originalImageSecondArgs.sys_url);
        return 'saved';
    }
}

