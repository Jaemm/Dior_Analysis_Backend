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
export class PorphyrinService {
    constructor(
        private database: DatabaseService,
        private S3Image: FileUploadService,
        private batchAnalysis: BatchAnalysisService,
    ) {}

    async analysis(data: AlgoAnalysisDTO, taskResponse: any, imageArgs: any) {
        const analyzedImageArgs = imageArgs.analyzedImageArgs;
        const analyzedImageRedArgs = imageArgs.analyzedImageRedArgs;
        const analyzedImageGreenArgs = imageArgs.analyzedImageGreenArgs;
        const maskRImageArgs = imageArgs.maskRImageArgs;
        const maskGImageArgs = imageArgs.maskGImageArgs;

        const originalImageArgs = imageArgs.originalImageArgs;

        taskResponse = {
            ver: taskResponse.ver,
            score: taskResponse.score,
            raw: taskResponse.raw,
            indexTotal: taskResponse.indexTotal,
            num_Total: taskResponse.num_Total,
            indexRed: taskResponse.indexRed,
            num_Red: taskResponse.num_Red,
            indexGreen: taskResponse.indexGreen,
            num_Green: taskResponse.num_Green,
            deviceModel: data.deviceModel,
            deviceOS: data.deviceOS,
            nth_analysis: '',
            lat: data.lat,
            long: data.long,
        };

        const retObj: any = {
            analyzedImage: {
                id: analyzedImageArgs.hash,
                url: analyzedImageArgs.url,
            },
            analyzedImageRed: {
                id: analyzedImageRedArgs.hash,
                url: analyzedImageRedArgs.url,
            },
            analyzedImageGreen: {
                id: analyzedImageGreenArgs.hash,
                url: analyzedImageGreenArgs.url,
            },
            maskImageR: {
                id: maskRImageArgs.hash,
                url: maskRImageArgs.url,
            },
            maskImageG: {
                id: maskGImageArgs.hash,
                url: maskGImageArgs.url,
            },
            originalImage: {
                id: originalImageArgs.hash,
                url: originalImageArgs.url,
            },
        };

        taskResponse = { ...taskResponse, ...retObj };

        return taskResponse;
    }

    async saveData(
        coputaionResutl: any,
        data: AlgoAnalysisDTO,
        taskResponse: any,
        imageRecords: any,
        originalImage: any,
        imageArgs: any,
    ) {
        const analyzedImage = Buffer.from(taskResponse.img, 'base64');
        const analyzedImageRed = Buffer.from(taskResponse.red, 'base64');
        const analyzedImageGreen = Buffer.from(taskResponse.green, 'base64');
        const maskRImage = Buffer.from(taskResponse.mask_R, 'base64');
        const maskGImage = Buffer.from(taskResponse.mask_G, 'base64');

        const originalImageSave = originalImage;

        const analyzedImageArgs = imageArgs.analyzedImageArgs;
        const analyzedImageRedArgs = imageArgs.analyzedImageRedArgs;
        const analyzedImageGreenArgs = imageArgs.analyzedImageGreenArgs;
        const maskRImageArgs = imageArgs.maskRImageArgs;
        const maskGImageArgs = imageArgs.maskGImageArgs;

        const originalImageArgs = imageArgs.originalImageArgs;

        // taskResponse = {
        //     ver: taskResponse.ver,
        //     score: taskResponse.score,
        //     raw: taskResponse.raw,
        // };

        delete taskResponse.img;
        delete taskResponse.red;
        delete taskResponse.green;
        delete taskResponse.mask_R;
        delete taskResponse.mask_G;
        delete taskResponse.err;

        await this.S3Image.uploadImage(originalImageSave, originalImageArgs.sys_url);

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

        taskResponse.computation_score = coputaionResutl.computation_score;
        taskResponse.questionnaire_score = coputaionResutl.questionnaire_score;

        await this.batchAnalysis.updateEnvironment(data.batch_id, environment);
        const saveSql =
            'INSERT INTO measurements (batch_id, url, sys_url, hash, type_measurement_id, type_image_id, args, scores) values ($1, $2, $3, $4, $5, $6, $7, $8)';
        const queries = [
            {
                variables: [
                    data.batch_id,
                    originalImageArgs.url,
                    originalImageArgs.sys_url,
                    originalImageArgs.hash,
                    3,
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
                    analyzedImageArgs.url,
                    analyzedImageArgs.sys_url,
                    analyzedImageArgs.hash,
                    3,
                    18,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                variables: [
                    data.batch_id,
                    analyzedImageRedArgs.url,
                    analyzedImageRedArgs.sys_url,
                    analyzedImageRedArgs.hash,
                    3,
                    22,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                variables: [
                    data.batch_id,
                    analyzedImageGreenArgs.url,
                    analyzedImageGreenArgs.sys_url,
                    analyzedImageGreenArgs.hash,
                    3,
                    14,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                variables: [
                    data.batch_id,
                    maskRImageArgs.url,
                    maskRImageArgs.sys_url,
                    maskRImageArgs.hash,
                    3,
                    12,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                variables: [
                    data.batch_id,
                    maskGImageArgs.url,
                    maskGImageArgs.sys_url,
                    maskGImageArgs.hash,
                    3,
                    2,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
        ];
        for (let i = 0; i < queries.length; i++) {
            this.database.executeQuery(saveSql, queries[i].variables);
        }

        const retObj: any = {
            analyzedImage: {
                id: analyzedImageArgs.hash,
                url: analyzedImageArgs.url,
            },
            analyzedImageRed: {
                id: analyzedImageRedArgs.hash,
                url: analyzedImageRedArgs.url,
            },
            analyzedImageGreen: {
                id: analyzedImageGreenArgs.hash,
                url: analyzedImageGreenArgs.url,
            },
            maskImageR: {
                id: maskRImageArgs.hash,
                url: maskRImageArgs.url,
            },
            maskImageG: {
                id: maskGImageArgs.hash,
                url: maskGImageArgs.url,
            },
            originalImage: {
                id: originalImageArgs.hash,
                url: originalImageArgs.url,
            },
        };
        taskResponse = { ...taskResponse, ...retObj };
        await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);
        await this.S3Image.uploadImage(analyzedImageRed, analyzedImageRedArgs.sys_url);
        await this.S3Image.uploadImage(analyzedImageGreen, analyzedImageGreenArgs.sys_url);

        await this.S3Image.uploadImage(maskRImage, maskRImageArgs.sys_url);
        await this.S3Image.uploadImage(maskGImage, maskGImageArgs.sys_url);
        await this.S3Image.uploadImage(originalImage, originalImageArgs.sys_url);
        return taskResponse;
    }

    async offlinesaveDataImage(originalImage: any, analyzedImage: any, imageArgs: any) {
        const analyzedImageArgs = imageArgs.analyzedImageArgs;

        const originalImageArgs = imageArgs.originalImageArgs;

        await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);
        // await this.S3Image.uploadImage(maskImage, maskImageArgs.sys_url);
        await this.S3Image.uploadImage(originalImage, originalImageArgs.sys_url);

        return 'saved';
    }
}

