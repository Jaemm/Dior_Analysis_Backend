import { Injectable, Inject, HttpException } from '@nestjs/common';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { DatabaseService } from 'src/database/database.service';
import * as celery from 'celery-node';
import { v4 as uuidv4 } from 'uuid';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import fs from 'fs';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { BatchAnalysisService } from 'src/modules/analysis/batchAnalysis/batchAnalysis.service';
import _ from 'lodash';

@Injectable()
export class WrinklesService {
    constructor(
        private database: DatabaseService,
        private S3Image: FileUploadService,
        private batchAnalysis: BatchAnalysisService,
    ) {}

    analysis(data: AlgoAnalysisDTO, taskResponse: any, imageArgs: any) {
        const analyzedImageArgs = imageArgs.analyzedImageArgs;

        const originalImageArgs = imageArgs.originalImageArgs;
        taskResponse = {
            ver: taskResponse.ver,
            score: taskResponse.score,
            raw: taskResponse.raw,

            score_Y: taskResponse.score_Y,
            score_O: taskResponse.score_O,
            score_G: taskResponse.score_G,
            score_P: taskResponse.score_P,
            yArea: taskResponse.yArea,
            oArea: taskResponse.oArea,
            gArea: taskResponse.gArea,
            pArea: taskResponse.pArea,
            r1: taskResponse.r1,
            r2: taskResponse.r2,
            r3: taskResponse.r3,
            r4: taskResponse.r4,
            r5: taskResponse.r5,
            r6: taskResponse.r6,
            r7: taskResponse.r7,
            r8: taskResponse.r8,
            r9: taskResponse.r9,
        };
        const retObj: any = {
            originalImage: {
                id: originalImageArgs.hash,
                url: originalImageArgs.url,
            },
            analyzedImage: {
                id: analyzedImageArgs.hash,
                url: analyzedImageArgs.url,
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
        // const maskImageYellow = Buffer.from(taskResponse.mask_Y, 'base64');
        // const maskImageOrange = Buffer.from(taskResponse.mask_O, 'base64');
        // const maskImageGreen = Buffer.from(taskResponse.mask_G, 'base64');
        // const maskImageBlack = Buffer.from(taskResponse.mask_P, 'base64');
        const originalImageSave = originalImage;

        const analyzedImageArgs = imageArgs.analyzedImageArgs;

        // const maskImageArgsYellow = imageArgs.maskImageArgsYellow;
        // const maskImageArgsOrange = imageArgs.maskImageArgsOrange;
        // const maskImageArgsGreen = imageArgs.maskImageArgsGreen;
        // const maskImageArgsBlack = imageArgs.maskImageArgsBlack;
        const originalImageArgs = imageArgs.originalImageArgs;

        delete taskResponse.img;
        delete taskResponse.mask_Y;
        delete taskResponse.mask_O;
        delete taskResponse.mask_G;
        delete taskResponse.mask_P;
        delete taskResponse.err;

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

        taskResponse = {
            ...taskResponse,
        };

        taskResponse.computation_score = coputaionResutl.computation_score;
        taskResponse.questionnaire_score = coputaionResutl.questionnaire_score;

        await this.batchAnalysis.updateEnvironment(data.batch_id, environment);

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
                    4,
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
                    originalImageArgs.url,
                    originalImageArgs.sys_url,
                    originalImageArgs.hash,
                    4,
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
        await this.S3Image.uploadImage(originalImageSave, originalImageArgs.sys_url);

        return 'saved';
    }

    imageArgs(data: AlgoAnalysisDTO) {
        const analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'keratin');
        const maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'keratin');

        const originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'keratin');

        return {
            analyzedImageArgs: analyzedImageArgs,
            maskImageArgs: maskImageArgs,
            originalImageArgs: originalImageArgs,
        };
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

