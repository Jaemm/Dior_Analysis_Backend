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
export class SpotsService {
    constructor(
        private database: DatabaseService,
        private S3Image: FileUploadService,
        private batchAnalysis: BatchAnalysisService,
    ) {}

    analysis(data: AlgoAnalysisDTO, taskResponse: any, imageArg: any) {
        const analyzedImageArgs = imageArg.analyzedImageArgs;
        const analyzedImageArgsYellow = imageArg.analyzedImageArgsYellow;
        const analyzedImageArgsOrange = imageArg.analyzedImageArgsOrange;
        const analyzedImageArgsGreen = imageArg.analyzedImageArgsGreen;
        const maskImageArgsYellow = imageArg.maskImageArgsYellow;
        const maskImageArgsOrange = imageArg.maskImageArgsOrange;
        const maskImageArgsGreen = imageArg.maskImageArgsGreen;
        const originalImageArgs = imageArg.originalImageArgs;

        taskResponse = {
            ver: taskResponse.ver,
            score: taskResponse.score,
            raw: taskResponse.raw,
            indexT: taskResponse.indexT,
            indexY: taskResponse.indexY,
            indexO: taskResponse.indexO,
            indexG: taskResponse.indexG,
        };

        const retObj: any = {
            analyzedImage: {
                id: analyzedImageArgs.hash,
                url: analyzedImageArgs.url,
            },
            originalImage: {
                id: originalImageArgs.hash,
                url: originalImageArgs.url,
            },
            analyzedImageYellow: {
                id: analyzedImageArgsYellow.hash,
                url: analyzedImageArgsYellow.url,
            },
            analyzedImageOrange: {
                id: analyzedImageArgsOrange.hash,
                url: analyzedImageArgsOrange.url,
            },
            analyzedImageGreen: {
                id: analyzedImageArgsGreen.hash,
                url: analyzedImageArgsGreen.url,
            },
            maskImageYellow: {
                id: maskImageArgsYellow.hash,
                url: maskImageArgsYellow.url,
            },
            maskImageOrange: {
                id: maskImageArgsOrange.hash,
                url: maskImageArgsOrange.url,
            },
            maskImageGreen: {
                id: maskImageArgsGreen.hash,
                url: maskImageArgsGreen.url,
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
        imageArg: any,
    ) {
        const analyzedImage = Buffer.from(taskResponse.img, 'base64');
        const analyzedImageYellow = Buffer.from(taskResponse.yellow, 'base64');
        const analyzedImageOrange = Buffer.from(taskResponse.orange, 'base64');
        const analyzedImageGreen = Buffer.from(taskResponse.green, 'base64');
        const maskImageYellow = Buffer.from(taskResponse.mask_Y, 'base64');
        const maskImageOrange = Buffer.from(taskResponse.mask_O, 'base64');
        const maskImageGreen = Buffer.from(taskResponse.mask_G, 'base64');
        const originalImageSave = originalImage;

        const analyzedImageArgs = imageArg.analyzedImageArgs;
        const analyzedImageArgsYellow = imageArg.analyzedImageArgsYellow;
        const analyzedImageArgsOrange = imageArg.analyzedImageArgsOrange;
        const analyzedImageArgsGreen = imageArg.analyzedImageArgsGreen;
        const maskImageArgsYellow = imageArg.maskImageArgsYellow;
        const maskImageArgsOrange = imageArg.maskImageArgsOrange;
        const maskImageArgsGreen = imageArg.maskImageArgsGreen;
        const originalImageArgs = imageArg.originalImageArgs;

        delete taskResponse.img;
        delete taskResponse.yellow;
        delete taskResponse.orange;
        delete taskResponse.green;
        delete taskResponse.mask_Y;
        delete taskResponse.mask_O;
        delete taskResponse.mask_G;
        delete taskResponse.err;

        taskResponse = {
            ...taskResponse,
        };

        taskResponse.computation_score = coputaionResutl.computation_score;
        taskResponse.questionnaire_score = coputaionResutl.questionnaire_score;

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
        // const saveArgsSql = 'INSERT INTO spots (batch_id, args) data ($1, $2)';
        const queries = [
            {
                variables: [
                    data.batch_id,
                    analyzedImageArgs.url,
                    analyzedImageArgs.sys_url,
                    analyzedImageArgs.hash,
                    8,
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
                    analyzedImageArgsYellow.url,
                    analyzedImageArgsYellow.sys_url,
                    analyzedImageArgsYellow.hash,
                    8,
                    5,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                variables: [
                    data.batch_id,
                    originalImageArgs.url,
                    originalImageArgs.sys_url,
                    originalImageArgs.hash,
                    8,
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
                    analyzedImageArgsOrange.url,
                    analyzedImageArgsOrange.sys_url,
                    analyzedImageArgsOrange.hash,
                    8,
                    17,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                variables: [
                    data.batch_id,
                    analyzedImageArgsGreen.url,
                    analyzedImageArgsGreen.sys_url,
                    analyzedImageArgsGreen.hash,
                    8,
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
                    maskImageArgsYellow.url,
                    maskImageArgsYellow.sys_url,
                    maskImageArgsYellow.hash,
                    8,
                    11,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                variables: [
                    data.batch_id,
                    maskImageArgsOrange.url,
                    maskImageArgsOrange.sys_url,
                    maskImageArgsOrange.hash,
                    8,
                    7,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                variables: [
                    data.batch_id,
                    maskImageArgsGreen.url,
                    maskImageArgsGreen.sys_url,
                    maskImageArgsGreen.hash,
                    8,
                    13,
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

        await this.batchAnalysis.updateEnvironment(data.batch_id, environment);
        await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);
        await this.S3Image.uploadImage(analyzedImageYellow, analyzedImageArgsYellow.sys_url);
        await this.S3Image.uploadImage(analyzedImageOrange, analyzedImageArgsOrange.sys_url);

        await this.S3Image.uploadImage(analyzedImageGreen, analyzedImageArgsGreen.sys_url);

        await this.S3Image.uploadImage(maskImageYellow, maskImageArgsYellow.sys_url);

        await this.S3Image.uploadImage(maskImageOrange, maskImageArgsOrange.sys_url);
        await this.S3Image.uploadImage(maskImageGreen, maskImageArgsGreen.sys_url);

        await this.S3Image.uploadImage(originalImageSave, originalImageArgs.sys_url);

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

