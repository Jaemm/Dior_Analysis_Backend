import { Injectable, Inject, HttpException } from '@nestjs/common';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { DatabaseService } from 'src/database/database.service';

import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { BatchAnalysisService } from 'src/modules/analysis/batchAnalysis/batchAnalysis.service';
import { OfflineDatasDTO } from 'src/common/Dto/analysis/offlineData.dto';

@Injectable()
export class PoresService {
    constructor(
        private database: DatabaseService,
        private S3Image: FileUploadService,
        private batchAnalysis: BatchAnalysisService,
    ) {}

    async analysis(data: AlgoAnalysisDTO, taskResponse: any, imageArgs: any) {
        const analyzedImageArgs = imageArgs.analyzedImageArgs;
        const analyzedImageArgsS = imageArgs.analyzedImageArgsS;
        const analyzedImageArgsM = imageArgs.analyzedImageArgsM;
        const analyzedImageArgsB = imageArgs.analyzedImageArgsB;
        const maskImageSmall = imageArgs.maskImageSmall;
        const maskImageArgsM = imageArgs.maskImageArgsM;
        const maskImageArgsB = imageArgs.maskImageArgsB;
        const originalImageArgs = imageArgs.originalImageArgs;

        taskResponse = {
            ver: taskResponse.ver,
            score: taskResponse.Number,
            raw: taskResponse.raw,

            indexS: taskResponse.indexS,
            indexM: taskResponse.indexM,
            indexB: taskResponse.indexB,
        };

        const retObj: any = {
            analyzedImage: {
                id: analyzedImageArgs.hash,
                url: analyzedImageArgs.url,
            },
            analyzedImageSmall: {
                id: analyzedImageArgsS.hash,
                url: analyzedImageArgsS.url,
            },
            analyzedImageMedium: {
                id: analyzedImageArgsM.hash,
                url: analyzedImageArgsM.url,
            },
            analyzedImageBig: {
                id: analyzedImageArgsB.hash,
                url: analyzedImageArgsB.url,
            },
            maskImageSmall: {
                id: maskImageSmall.hash,
                url: maskImageSmall.url,
            },
            maskImageMedium: {
                id: maskImageArgsM.hash,
                url: maskImageArgsM.url,
            },
            maskImageBig: {
                id: maskImageArgsB.hash,
                url: maskImageArgsB.url,
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
        taskResponse.computation_score = coputaionResutl.computation_score;
        taskResponse.questionnaire_score = coputaionResutl.questionnaire_score;

        const analyzedImage = Buffer.from(taskResponse.img, 'base64');
        const analyzedImageS = Buffer.from(taskResponse.img_S, 'base64');
        const analyzedImageM = Buffer.from(taskResponse.img_M, 'base64');
        const analyzedImageB = Buffer.from(taskResponse.img_B, 'base64');
        const maskImageS = Buffer.from(taskResponse.mask_S, 'base64');
        const maskImageM = Buffer.from(taskResponse.mask_M, 'base64');
        const maskImageB = Buffer.from(taskResponse.mask_B, 'base64');
        const originalImageSave = originalImage;

        const analyzedImageArgs = imageArgs.analyzedImageArgs;
        const analyzedImageArgsS = imageArgs.analyzedImageArgsS;
        const analyzedImageArgsM = imageArgs.analyzedImageArgsM;
        const analyzedImageArgsB = imageArgs.analyzedImageArgsB;
        const maskImageSmall = imageArgs.maskImageSmall;
        const maskImageArgsM = imageArgs.maskImageArgsM;
        const maskImageArgsB = imageArgs.maskImageArgsB;
        const originalImageArgs = imageArgs.originalImageArgs;

        delete taskResponse.img;
        delete taskResponse.img_S;
        delete taskResponse.img_M;
        delete taskResponse.img_B;
        delete taskResponse.mask_S;
        delete taskResponse.mask_M;
        delete taskResponse.mask_B;
        delete taskResponse.err;

        await this.S3Image.uploadImage(originalImageSave, originalImageArgs.sys_url);

        delete taskResponse.img;
        delete taskResponse.mask;
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

        const saveSql =
            'INSERT INTO measurements (batch_id, url, sys_url, hash, type_measurement_id, type_image_id, args, scores) values ($1, $2, $3, $4, $5, $6, $7, $8)';
        const queries = [
            {
                //analyzed_image
                variables: [
                    data.batch_id,
                    analyzedImageArgs.url,
                    analyzedImageArgs.sys_url,
                    analyzedImageArgs.hash,
                    1,
                    18,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                //analyzedImageSmall
                variables: [
                    data.batch_id,
                    analyzedImageArgsS.url,
                    analyzedImageArgsS.sys_url,
                    analyzedImageArgsS.hash,
                    1,
                    25,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                //analyzed_image_Medium
                variables: [
                    data.batch_id,
                    analyzedImageArgsM.url,
                    analyzedImageArgsM.sys_url,
                    analyzedImageArgsM.hash,
                    1,
                    16,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                //analyzed_image_big
                variables: [
                    data.batch_id,
                    analyzedImageArgsB.url,
                    analyzedImageArgsB.sys_url,
                    analyzedImageArgsB.hash,
                    1,
                    24,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },

            {
                // maskImageSmall
                variables: [
                    data.batch_id,
                    maskImageSmall.url,
                    maskImageSmall.sys_url,
                    maskImageSmall.hash,
                    1,
                    4,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                // maskImgaMedium
                variables: [
                    data.batch_id,
                    maskImageArgsM.url,
                    maskImageArgsM.sys_url,
                    maskImageArgsM.hash,
                    1,
                    16,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                // maskImageBig
                variables: [
                    data.batch_id,
                    maskImageArgsB.url,
                    maskImageArgsB.sys_url,
                    maskImageArgsB.hash,
                    1,
                    26,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                //Original
                variables: [
                    data.batch_id,
                    originalImageArgs.url,
                    originalImageArgs.sys_url,
                    originalImageArgs.hash,
                    1,
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

        await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);

        await this.S3Image.uploadImage(analyzedImageS, analyzedImageArgsS.sys_url);

        await this.S3Image.uploadImage(analyzedImageM, analyzedImageArgsM.sys_url);

        await this.S3Image.uploadImage(analyzedImageB, analyzedImageArgsB.sys_url);

        await this.S3Image.uploadImage(maskImageS, maskImageSmall.sys_url);

        await this.S3Image.uploadImage(maskImageM, maskImageArgsM.sys_url);

        await this.S3Image.uploadImage(maskImageB, maskImageArgsB.sys_url);
        await this.batchAnalysis.updateEnvironment(data.batch_id, environment);

        taskResponse = { ...taskResponse };

        return taskResponse;
    }

    async offlineSaveData(data: OfflineDatasDTO, imageRecords: any, imageArgs: any) {
        const analyzedImageArgs = imageArgs.analyzedImageArgs;
        // const maskImageArgs = imageArgs.maskImageArgs;

        const originalImageArgs = imageArgs.originalImageArgs;

        const environment = {
            deviceModel: data.deviceModel,
            deviceOS: data.deviceOS,
            nth_analysis: imageRecords,
            lat: data.lat,
            long: data.long,
            temperature: data.temperature,
            humidity: data.humidity,
            uv_index: data.uv_index,
            appVersion: data.appVersion,

        };

        await this.batchAnalysis.updateEnvironment(data.batchId, environment);
        const saveSql =
            'INSERT INTO measurements (batch_id, url, sys_url, hash, type_measurement_id, type_image_id, args, scores) values ($1, $2, $3, $4, $5, $6, $7, $8)';
        // const saveArgsSql = 'INSERT INTO keratin (batch_id, args) data ($1, $2)';
        const queries = [
            {
                variables: [
                    data.batchId,
                    analyzedImageArgs.url,
                    analyzedImageArgs.sys_url,
                    analyzedImageArgs.hash,
                    1,
                    18,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },

            {
                variables: [
                    data.batchId,
                    originalImageArgs.url,
                    originalImageArgs.sys_url,
                    originalImageArgs.hash,
                    1,
                    21,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    JSON.stringify(data.args),
                ],
            },
        ];

        for (let i = 0; i < queries.length; i++) {
            this.database.executeQuery(saveSql, queries[i].variables);
        }

        return 'saved';
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

