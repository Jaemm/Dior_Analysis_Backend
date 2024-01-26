import {
    Injectable,
    Inject,
    HttpException,
    ConsoleLogger,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { KeratinService } from 'src/modules/algorithms/keratin/keratin.service';
import { PoresService } from 'src/modules/algorithms/pores/pores.service';
import { PorphyrinService } from 'src/modules/algorithms/porphyrin/porphyrin.service';
import { SebumService } from 'src/modules/algorithms/sebum/sebum.service';
import { SebumTService } from 'src/modules/algorithms/sebumT/sebumT.service';
import { ShineService } from 'src/modules/algorithms/shine/shine.service';
import { SpotsService } from 'src/modules/algorithms/spots/spots.service';
import { SkintoneService } from 'src/modules/algorithms/skinTone/skinTone.service';
import { SkinToneDiorService } from 'src/modules/algorithms/skinToneDior/skinToneDior.service';
import { WrinklesService } from 'src/modules/algorithms/wrinkles/wrinkles.service';
import { SensitivityScabsService } from 'src/modules/algorithms/sensitivityScabs/sensitivityScabs.service';
import { SensitivityRednessService } from 'src/modules/algorithms/sensitivityRedness/sensitivityRedness.service';
import { SensitivtyScalingService } from 'src/modules/algorithms/sensitivtyScaling/sensitivtyScaling.service';
import { FitzSGService } from 'src/modules/algorithms/fitzSG/fitzSG.service';
import * as moment from 'moment';
import { OfflineDataCBBDTO } from 'src/common/Dto/analysis/offlineData.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AlgoAnalysisService {
    constructor(
        private database: DatabaseService,
        private keratin: KeratinService,
        private pores: PoresService,
        private porphyrin: PorphyrinService,
        private sebum: SebumService,
        private sebumT: SebumTService,
        private shine: ShineService,
        private spots: SpotsService,
        private skintone: SkintoneService,
        private skintone_dior: SkinToneDiorService,
        private wrinkles: WrinklesService,
        private sensitivityScabs: SensitivityScabsService,
        private sensitivityredness: SensitivityRednessService,
        private sensitivityScaling: SensitivtyScalingService,
        private fitzSG: FitzSGService,
        private S3Image: FileUploadService,
    ) {}

    convertScoresToNumbers = (data: any) => {
        for (const key in data) {
            if (Array.isArray(data[key])) {
                data[key].forEach((item: any) => {
                    if (item.score) {
                        item.score = parseInt(item.score, 10);
                    }
                });
            }
        }
    };
    getTaskByAlgoType(type: string) {
        switch (type) {
            case 'keratin':
                return { taskName: 'CNDP_SkinKeratin', algoName: 'keratin' };
            case 'pores':
                return { taskName: 'CNDP_SkinPore', algoName: 'pores' };
            case 'porphyrin':
                return { taskName: 'CNDP_SkinPorphyrin', algoName: 'porphyrin' };
            case 'sebum':
                return { taskName: 'CNDP_SkinSebum', algoName: 'sebum' };
            case 'shine':
                return { taskName: 'CNDP_SkinShine', algoName: 'shine' };
            case 'spots':
                return { taskName: 'CNDP_SkinSpots', algoName: 'spots' };
            case 'skintone':
                return { taskName: 'CNDP_SkinTone', algoName: 'skintone' };
            case 'skintone_dior':
                return { taskName: 'CNDP_SkinTone_Dior', algoName: 'skintone_dior' };
            case 'wrinkles':
                return { taskName: 'CNDP_SkinWrinkles', algoName: 'wrinkles' };
            case 'sensitivityscabs':
                return { taskName: 'CNDP_SensScabs', algoName: 'sensitivityscabs' };
            case 'sensitivityscaling':
                return { taskName: 'CNDP_SensScaling', algoName: 'sensitivityscaling' };
            case 'sensitivityredness':
                return { taskName: 'CNDP_SensRedness', algoName: 'sensitivityredness' };
            case 'fitzSG':
                return { taskName: 'CNDP_FitzSG', algoName: 'fitzSG' };
            default:
                throw new Error('Wrong algorithm TYPE!');
        }
    }

    // getCBBTaskByAlgoType
    getCBBTaskByAlgoType(type: number) {
        switch (Number(type)) {
            case 1:
                return { taskName: 'CNDP_SkinKeratin', algoName: 'keratin', id: 11 };
            case 2:
                return { taskName: 'CNDP_SkinPore', algoName: 'pores', id: 1 };
            case 3:
                return { taskName: 'CNDP_SkinPorphyrin', algoName: 'porphyrin', id: 3 };
            case 4:
                return { taskName: 'CNDP_SkinSebum', algoName: 'sebum', id: 15 };
            case 5:
                return { taskName: 'CNDP_SkinShine', algoName: 'shine', id: 10 };
            case 6:
                return { taskName: 'CNDP_SkinSpots', algoName: 'spots', id: 8 };
            // case 'skintone':
            //     return { taskName: 'CNDP_SkinTone', algoName: 'skintone' };
            // case 'skintone_dior':
            //     return { taskName: 'CNDP_SkinTone_Dior', algoName: 'skintone_dior' };
            case 7:
                return { taskName: 'CNDP_SkinWrinkles', algoName: 'wrinkles', id: 4 };

            case 8:
                return { taskName: 'CNDP_SensScabs', algoName: 'sensitivityscabs', id: 1 };
            case 9:
                return { taskName: 'CNDP_SensScaling', algoName: 'sensitivityscaling', id: 2 };
            case 10:
                return { taskName: 'CNDP_SensRedness', algoName: 'sensitivityredness', id: 12 };

            default:
                throw new Error('Wrong algorithm TYPE!');
        }
    }

    handleAnalysis(data: AlgoAnalysisDTO, taskResponse: any, imageArgs: any) {
        try {
            switch (data.type) {
                case 'keratin':
                    return this.keratin.analysis(data, taskResponse, imageArgs);

                case 'pores':
                    return this.pores.analysis(data, taskResponse, imageArgs);
                case 'porphyrin':
                    return this.porphyrin.analysis(data, taskResponse, imageArgs);
                case 'sebum':
                    return this.sebum.analysis(data, taskResponse, imageArgs);
                // case 'sebumT':
                //     return this.sebumT.analysis(data, taskResponse);
                case 'shine':
                    return this.shine.analysis(data, taskResponse, imageArgs);
                case 'spots':
                    return this.spots.analysis(data, taskResponse, imageArgs);
                case 'skintone':
                    return this.skintone.analysis(data, taskResponse, imageArgs);
                // case 'skintone_dior':
                //     return this.skintone_dior.analysis(data, taskResponse, imageArgs);
                case 'wrinkles':
                    return this.wrinkles.analysis(data, taskResponse, imageArgs);
                case 'sensitivityscabs':
                    return this.sensitivityScabs.analysis(data, taskResponse, imageArgs);
                case 'sensitivityscaling':
                    return this.sensitivityScaling.analysis(data, taskResponse, imageArgs);
                case 'sensitivityredness':
                    return this.sensitivityredness.analysis(data, taskResponse, imageArgs);
                // case 'fitzSG':
                //     return this.fitzSG.analysis(data, taskResponse, imageArgs);
                default:
                    throw new Error('No such analysis type');
            }
        } catch (e) {
            console.log(e);
        }
    }

    async handleSaving(
        coputaionResutl: any,
        data: AlgoAnalysisDTO,
        taskResponse: any,
        imageRecords: any,
        originalImage: any,
        imageArgs: any,
    ) {
        switch (data.type) {
            case 'keratin':
                return this.keratin.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'pores':
                return this.pores.saveData(coputaionResutl, data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'porphyrin':
                return this.porphyrin.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'sebum':
                return this.sebum.saveData(coputaionResutl, data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'shine':
                return this.shine.saveData(coputaionResutl, data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'spots':
                return this.spots.saveData(coputaionResutl, data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'skintone':
                return this.skintone.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'wrinkles':
                return this.wrinkles.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'sensitivityscabs':
                return this.sensitivityScabs.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'sensitivityscaling':
                return this.sensitivityScaling.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'sensitivityredness':
                return this.sensitivityredness.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'fitzSG':
                return this.fitzSG.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            default:
                throw new Error('No such analysis type');
        }
    }

    handleImageArg(data: any) {
        let analyzedImageArgs;
        let analyzedImageArgsS;
        let analyzedImageArgsM;
        let analyzedImageArgsB;
        let maskImageArgs;
        let maskImageArgsM;
        let maskImageArgsB;
        let originalImageArgs;

        let analyzedImageRedArgs;
        let analyzedImageGreenArgs;
        let maskRImageArgs;
        let maskGImageArgs;
        let analyzedImageArgsYellow;
        let analyzedImageArgsOrange;
        let analyzedImageArgsGreen;
        let maskImageArgsYellow;
        let maskImageArgsOrange;
        let maskImageArgsGreen;
        let maskImageArgsBlack;
        let maskImageSmall;

        switch (data.type) {
            case 'keratin':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'keratin');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'keratin');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'keratin');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'pores':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'pores');
                analyzedImageArgsS = this.S3Image.getImageArgs('analyzedImageSmall', data.task.algoName, 'pores');
                analyzedImageArgsM = this.S3Image.getImageArgs('analyzedImageMedium', data.task.algoName, 'pores');
                analyzedImageArgsB = this.S3Image.getImageArgs('analyzedImageBig', data.task.algoName, 'pores');
                maskImageSmall = this.S3Image.getImageArgs('maskImageSmall', data.task.algoName, 'pores');
                maskImageArgsM = this.S3Image.getImageArgs('maskImageMedium', data.task.algoName, 'pores');
                maskImageArgsB = this.S3Image.getImageArgs('maskImageBig', data.task.algoName, 'pores');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'pores');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    analyzedImageArgsM: analyzedImageArgsM,
                    analyzedImageArgsB: analyzedImageArgsB,
                    // maskImageArgs: maskImageArgs,
                    maskImageSmall: maskImageSmall,
                    maskImageArgsM: maskImageArgsM,
                    maskImageArgsB: maskImageArgsB,
                    originalImageArgs: originalImageArgs,
                    analyzedImageArgsS: analyzedImageArgsS,
                };
            case 'porphyrin':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'porphyrin');
                analyzedImageRedArgs = this.S3Image.getImageArgs('analyzedImageRed', data.task.algoName, 'porphyrin');
                analyzedImageGreenArgs = this.S3Image.getImageArgs(
                    'analyzedImageGreen',
                    data.task.algoName,
                    'porphyrin',
                );
                maskRImageArgs = this.S3Image.getImageArgs('maskImageR', data.task.algoName, 'porphyrin');
                maskGImageArgs = this.S3Image.getImageArgs('maskImageG', data.task.algoName, 'porphyrin');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'porphyrin');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    analyzedImageRedArgs: analyzedImageRedArgs,
                    analyzedImageGreenArgs: analyzedImageGreenArgs,
                    maskRImageArgs: maskRImageArgs,
                    maskGImageArgs: maskGImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'sebum':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'sebum');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'sebum');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'sebum');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            // case 'sebumT':
            //     return this.sebumT.saveData(data, taskResponse, imageRecords, originalImage);
            case 'shine':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'shine');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'shine');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'shine');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'spots':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'spots');
                analyzedImageArgsYellow = this.S3Image.getImageArgs('analyzedImageYellow', data.task.algoName, 'spots');
                analyzedImageArgsOrange = this.S3Image.getImageArgs('analyzedImageOrange', data.task.algoName, 'spots');
                analyzedImageArgsGreen = this.S3Image.getImageArgs('analyzedImageGreen', data.task.algoName, 'spots');
                maskImageArgsYellow = this.S3Image.getImageArgs('maskImageYellow', data.task.algoName, 'spots');
                maskImageArgsOrange = this.S3Image.getImageArgs('maskImageOrange', data.task.algoName, 'spots');
                maskImageArgsGreen = this.S3Image.getImageArgs('maskImageGreen', data.task.algoName, 'spots');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'spots');
                return {
                    analyzedImageArgsYellow: analyzedImageArgsYellow,
                    analyzedImageArgsOrange: analyzedImageArgsOrange,
                    analyzedImageArgsGreen: analyzedImageArgsGreen,
                    maskImageArgsYellow: maskImageArgsYellow,
                    maskImageArgsOrange: maskImageArgsOrange,
                    maskImageArgsGreen: maskImageArgsGreen,
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'skintone':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'skintone');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'skintone');

                return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };
            case 'skintone_dior':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'skintone');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'skintone');

                return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };

            case 'wrinkles':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'wrinkles');

                maskImageArgsYellow = this.S3Image.getImageArgs('maskImageYellow', data.task.algoName, 'wrinkles');
                maskImageArgsOrange = this.S3Image.getImageArgs('maskImageOrange', data.task.algoName, 'wrinkles');
                maskImageArgsGreen = this.S3Image.getImageArgs('maskImageGreen', data.task.algoName, 'wrinkles');
                maskImageArgsBlack = this.S3Image.getImageArgs('maskImageBlack', data.task.algoName, 'wrinkles');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'wrinkles');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgsYellow: maskImageArgsYellow,
                    maskImageArgsOrange: maskImageArgsOrange,
                    maskImageArgsGreen: maskImageArgsGreen,
                    maskImageArgsBlack: maskImageArgsBlack,
                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityscabs':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'sensitivityscabs');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'sensitivityscabs');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityscaling':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'sensitivityscabs');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'sensitivityscabs');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityredness':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'sensitivityscabs');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'sensitivityscabs');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'fitzSG':
                return;
            default:
                throw new Error('No such analysis type');
        }
    }

    handleCBBImageArg(data: any) {
        let analyzedImageArgs;
        let originalImageArgs;

        switch (Number(data.algorithmId)) {
            case 1:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'keratin');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'keratin');
                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 2:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivity');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivity');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 3:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'impurities');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'impurities');
                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 4:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'wrinkles');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'wrinkles');

                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };

            case 5:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sebumU');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sebumU');

                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };

            case 6:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sebumT');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sebumT');

                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            // case 'sebumT':
            //     return this.sebumT.saveData(data, taskResponse, imageRecords, originalImage);
            case 7:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'spots');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'spots');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 8:
                analyzedImageArgs = this.S3Image.getImageArgs('originalImage1', data.type, 'skintone');

                originalImageArgs = this.S3Image.getImageArgs('originalImage2', data.type, 'skintone');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            // case 'skintone':
            //     analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'skintone');

            //     originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'skintone');

            //     return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };
            // case 'skintone_dior':
            //     analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'skintone');

            //     originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'skintone');

            //     return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };

            case 9:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'oiliness');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'oiliness');
                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 10:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'keratin');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'keratin');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            // case 9:
            //     analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivityscabs');
            //     originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivityscabs');

            //     return {
            //         analyzedImageArgs: analyzedImageArgs,

            //         originalImageArgs: originalImageArgs,
            //     };
            // case 10:
            //     analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivityscabs');

            //     originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivityscabs');

            //     return {
            //         analyzedImageArgs: analyzedImageArgs,

            //         originalImageArgs: originalImageArgs,
            //     };

            default:
                throw new Error('No such analysis type');
        }
    }

    async finalAnalysis(data: AlgoAnalysisDTO, imageRecords: any, taskResponse: any, imageArg: any) {
        try {
            if (taskResponse.err) {
                throw new HttpException(`analysis - ${data.task.taskName} -> ${data.type}`, 40004);
            }

            let args = await this.handleAnalysis(data, taskResponse, imageArg);
            let responseBody = {
                batchId: data.batch_id,
                algorithm_type: data.type,
                ...args,
            };

            return responseBody;
        } catch (e) {
            console.log(e);
        }
    }

    // offline image args
    handleofflineImageArg(data: any) {
        let analyzedImageArgs;

        let originalImageArgs;

        switch (data.type) {
            case 'keratin':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'keratin');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'keratin');
                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 'pores':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'pores');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'pores');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'porphyrin':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'porphyrin');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'porphyrin');
                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 'sebum':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sebum');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sebum');

                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            // case 'sebumT':
            //     return this.sebumT.saveData(data, taskResponse, imageRecords, originalImage);
            case 'shine':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'shine');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'shine');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'spots':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'spots');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'spots');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'skintone':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'skintone');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'skintone');

                return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };
            case 'skintone_dior':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'skintone');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'skintone');

                return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };

            case 'wrinkles':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'wrinkles');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'wrinkles');
                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityscabs':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivityscabs');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityscaling':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivityscabs');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityredness':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivityscabs');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 'fitzSG':
                return;
            default:
                throw new Error('No such analysis type');
        }
    }

    // OfflinesaveDataImage

    async updateEnvironment(batch_id: number, environment: any) {
        try {
            let data = JSON.stringify(environment);

            const update = `
                    UPDATE analysis
                    SET args = $1
                    WHERE batch_id = $2
                  `;

            this.database.executeQuery(update, [data, batch_id]);
            return update;
        } catch (e) {
            console.log('check', e);
        }
    }

    async finalSave(
        coputaionResutl: any,
        data: AlgoAnalysisDTO,
        image: Express.Multer.File,
        imageRecords: any,
        taskResponse: any,
        imageArg: any,
    ) {
        if (taskResponse.err) {
            throw new HttpException(`analysis - ${data.task.taskName} -> ${data.type}`, 40004);
        }

        let args = await this.handleSaving(coputaionResutl, data, taskResponse, imageRecords, image?.buffer, imageArg);
        let responseBody = {
            batchId: data.batch_id,
            algorithm_type: data.type,
            ...args,
        };

        return responseBody;
    }

    async insertImage(batch_id: any, url: string, sys_url: string, hash: string, type_image_id: any, args: any) {
        try {
            const insert = this.database.executeQuery(
                `
                    INSERT INTO images (batch_id,  url, sys  url, hash, type_image_id, args) 
                    values (${batch_id}, '${url}', '${sys_url}', '${hash}', ${type_image_id}, '${args}')
                    `,
            );
            return (await insert).length;
        } catch (e) {
            throw new Error(e);
        }
    }

    async getImage(name: any) {
        try {
            const mesureId = await this.database.executeQuery(`SELECT id FROM type_images WHERE name = '${name}'`);
            if (mesureId['rows'][0]['id']) {
                return mesureId['rows'][0]['id'];
            } else {
                throw new Error('Image was not found');
            }
        } catch (e) {
            throw new Error(e);
        }
    }

    async getAnalysisData(batch_id: any) {
        try {
            const mesureId = await this.database.executeQuery(
                `SELECT
                analysis.batch_id,
                to_timestamp( CAST ( analysis.created_time AS TEXT ), 'YYYY-MM-DD HH24:MI:SS' ) AS DATE,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 1 ), 2 ) AS pores_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 1 ), 2 ) AS pores_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 2 ), 2 ) AS sensitivity_scaling_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 2 ), 2 ) AS sensitivity_scaling_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 3 ), 2 ) AS porphiryn_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 3 ), 2 ) AS porphiryn_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 4 ), 2 ) AS wrinkles_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 4 ), 4 ) AS wrinkles_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 5 ), 2 ) AS sebum_u_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 5 ), 5 ) AS sebum_u_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 6 ), 2 ) AS skintone_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 6 ), 2 ) AS skintone_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 8 ), 2 ) AS spots_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 8 ), 2 ) AS spots_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 9 ), 2 ) AS sebum_t_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 9 ), 2 ) AS sebum_t_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 10 ), 2 ) AS shine_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 10 ), 2 ) AS shine_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 11 ), 2 ) AS keratin_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 11 ), 2 ) AS keratin_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 12 ), 2 ) AS sensitivity_redness_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 12 ), 2 ) AS sensitivity_redness_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 14 ), 2 ) AS sensitivity_scabs_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 14 ), 2 ) AS sensitivity_scabs_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 15 ), 2 ) AS sebum_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 15 ), 2 ) AS sebum_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 16 ), 2 ) AS moisture_t_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 16 ), 2 ) AS moisture_t_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 17 ), 2 ) AS moisture_u_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 17 ), 2 ) AS moisture_u_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 18 ), 2 ) AS moisture_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 18 ), 2 ) AS moisture_computation
            FROM
                analysis
                LEFT JOIN answers_to_questions ON analysis.batch_id = answers_to_questions.batch_id
                LEFT JOIN measurements ON analysis.batch_id = measurements.batch_id
                LEFT JOIN type_measurements ON type_measurement_id = type_measurements."id" 
            WHERE
                analysis.batch_id = $1 
                AND type_image_id = 21 
            GROUP BY
                analysis.batch_id`,
                [batch_id],
            );

            // mesureId[0].filter((result) => result !== undefined);
            const val = mesureId[0];
            const final = {
                ...val,
                // keratin
                keratin_computation: val.keratin_computation === null ? val.keratin_score : val.keratin_computation,
                // pores

                pores_computation: val.pores_computation === null ? val.pores_score : val.pores_computation,
                // sensitivity_redness
                sensitivity_redness_computation:
                    val.sensitivity_redness_computation === null
                        ? val.sensitivity_redness_score
                        : val.sensitivity_redness_computation,
                // spots

                spots_computation: val.spots_computation === null ? val.spots_score : val.spots_computation,
                //wrinkles

                wrinkles_computation: val.wrinkles_computation === null ? val.wrinkles_score : val.wrinkles_computation,
                // porphyrim

                porphiryn_computation:
                    val.porphiryn_computation === null ? val.porphiryn_score : val.porphiryn_computation,
                //moisture

                moisture_computation: val.moisture_computation === null ? val.moisture_score : val.moisture_computation,
                //sebum

                sebum_computation: val.sebum_computation === null ? val.sebum_score : val.sebumn_computation,
                //shine

                shine_computation: val.shine_computation === null ? val.shine_score : val.shine_computation,
                //skintone

                skintone_computation: val.skintone_computation === null ? val.skintone_score : val.skintone_computation,
                // sensitivity_scabs

                sensitivity_scabs_computation:
                    val.sensitivity_scabs_computation === null
                        ? val.sensitivity_scabs_score
                        : val.sensitivity_scabs_computation,
                // sensitivity_scaling

                sensitivity_scaling_computation:
                    val.sensitivity_scaling_computation === null
                        ? val.sensitivity_scaling_score
                        : val.sensitivity_scaling_computation,
                //moisture_u

                moisture_u_computation:
                    val.moisture_u_computation === null ? val.moisture_u_score : val.moisture_u_computation,
                // moisture_t_score

                moisture_t_computation:
                    val.moisture_t_computation === null ? val.moisture_t_score : val.moisture_t_computation,
                //sebum_u

                sebum_u_computation: val.sebum_u_computation === null ? val.sebum_u_score : val.sebum_u_computation,

                // sebum_t

                sebum_t_computation: val.sebum_t_computation === null ? val.sebum_t_score : val.sebum_t_computation,
            };

            return final;

            // return mesureId[0];
            // if (mesureId['rows'][0]['id']) {
            //     return mesureId['rows'][0]['id'];
            // } else {
            //     throw new Error('Image was not found');
            // }
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    async getImageByBatch(batch_id: any) {
        try {
            const image = await this.database.executeQuery(
                `
                SELECT tps."name", ms.url
                FROM measurements ms 
                    LEFT JOIN type_measurements tps ON tps."id" = ms.type_measurement_id
                WHERE
                    batch_id = $1
                    AND type_image_id = 21`,
                [batch_id],
            );

            return image;
            // if (mesureId['rows'][0]['id']) {
            //     return mesureId['rows'][0]['id'];
            // } else {
            //     throw new Error('Image was not found');
            // }
        } catch (e) {
            throw new Error(e);
        }
    }

    async getAnalysisByBatchId(batch_id: number) {
        const result = await this.database.executeQuery(
            `SELECT
                analysis.batch_id,
                to_timestamp( CAST ( analysis.created_time AS TEXT ), 'YYYY-MM-DD HH24:MI:SS' ) AS DATE,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 1 ), 2 ) AS pores_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 1 ), 2 ) AS pores_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 2 ), 2 ) AS sensitivity_scaling_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 2 ), 2 ) AS sensitivity_scaling_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 3 ), 2 ) AS porphiryn_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 3 ), 2 ) AS porphiryn_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 4 ), 2 ) AS wrinkles_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 4 ), 4 ) AS wrinkles_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 5 ), 2 ) AS sebum_u_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 5 ), 5 ) AS sebum_u_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 6 ), 2 ) AS skintone_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 6 ), 2 ) AS skintone_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 8 ), 2 ) AS spots_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 8 ), 2 ) AS spots_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 9 ), 2 ) AS sebum_t_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 9 ), 2 ) AS sebum_t_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 10 ), 2 ) AS shine_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 10 ), 2 ) AS shine_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 11 ), 2 ) AS keratin_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 11 ), 2 ) AS keratin_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 12 ), 2 ) AS sensitivity_redness_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 12 ), 2 ) AS sensitivity_redness_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 14 ), 2 ) AS sensitivity_scabs_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 14 ), 2 ) AS sensitivity_scabs_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 15 ), 2 ) AS sebum_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 15 ), 2 ) AS sebum_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 16 ), 2 ) AS moisture_t_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 16 ), 2 ) AS moisture_t_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 17 ), 2 ) AS moisture_u_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 17 ), 2 ) AS moisture_u_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 18 ), 2 ) AS moisture_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 18 ), 2 ) AS moisture_computation
            FROM
                analysis
                LEFT JOIN answers_to_questions ON analysis.batch_id = answers_to_questions.batch_id
                LEFT JOIN measurements ON analysis.batch_id = measurements.batch_id
                LEFT JOIN type_measurements ON type_measurement_id = type_measurements."id" 
            WHERE
                analysis.batch_id = $1 
                AND type_image_id = 21 
            GROUP BY
                analysis.batch_id`,
            [batch_id],
        );
        return result[0];
    }

    //get all batch_id of customer

    async getCustomerBatchID(customer_id: number, per: number, page: number): Promise<any[]> {
        let offset = (page - 1) * per;

        let batchIds: any;
        if (!per || !page) {
            batchIds = await this.database.executeQuery(
                `SELECT batch_id FROM analysis WHERE customer_id = '${customer_id}'`,
            );
        } else {
            batchIds = await this.database.executeQuery(
                `SELECT batch_id FROM analysis WHERE customer_id = '${customer_id}' LIMIT ${per} OFFSET ${offset}`,
            );
        }

        return batchIds;
    }

    async userAnalysisHistory(customer_id: number, per: number, page: number): Promise<any[]> {
        let batchIds = await this.getCustomerBatchID(customer_id, per, page);

        const promises: Promise<any>[] = [];
        // geting result
        for (const batchId of batchIds) {
            promises.push(this.getAnalysisByBatchId(batchId['batch_id']));
        }

        // computation
        try {
            const resultObj = await Promise.all(promises);
            // remooving empty object
            const nonEmptyResults: any[] = resultObj.filter((result) => result !== undefined);
            nonEmptyResults.map((val) => {
                val.customer_id = customer_id;
                val.sens_redness_combined_score = null;
                // keratin
                val.keratin_score = val.keratin_score === null ? null : Number(val.keratin_score);
                val.keratin_computation =
                    val.keratin_computation === null ? val.keratin_score : val.keratin_computation;
                // pores
                val.pores_score =
                    val.pores_score !== null
                        ? isNaN(parseFloat(val.pores_score))
                            ? null
                            : parseFloat(val.pores_score)
                        : null;
                val.pores_computation = val.pores_computation === null ? val.pores_score : val.pores_computation;
                // sensitivity_redness
                val.sensitivity_redness_score =
                    val.sensitivity_redness_score === null ? null : Number(val.sensitivity_redness_score);
                val.sensitivity_redness_computation =
                    val.sensitivity_redness_computation === null
                        ? val.sensitivity_redness_score
                        : val.sensitivity_redness_computation;
                // spots
                val.spots_score = val.spots_score === null ? null : Number(val.spots_score);
                val.spots_computation = val.spots_computation === null ? val.spots_score : val.spots_computation;
                //wrinkles
                val.wrinkles_score = val.wrinkles_score === null ? null : Number(val.wrinkles_score);
                val.wrinkles_computation =
                    val.wrinkles_computation === null ? val.wrinkles_score : val.wrinkles_computation;
                // porphyrim
                val.porphiryn_score = val.porphiryn_score === null ? null : Number(val.porphiryn_score);
                val.porphiryn_computation =
                    val.porphiryn_computation === null ? val.porphiryn_score : val.porphiryn_computation;
                //moisture
                val.moisture_score = val.moisture_score === null ? null : Number(val.moisture_score);
                val.moisture_computation =
                    val.moisture_computation === null ? val.moisture_score : val.moisture_computation;
                //sebum
                val.sebum_score = val.sebum_score === null ? null : Number(val.sebum_score);
                val.sebum_computation = val.sebum_computation === null ? val.sebum_score : val.sebumn_computation;
                //shine
                val.shine_score = val.shine_score === null ? null : Number(val.shine_score);
                val.shine_computation = val.shine_computation === null ? val.shine_score : val.shine_computation;
                //skintone
                val.skintone_score = val.skintone_score === null ? null : Number(val.skintone_score);
                val.skintone_computation =
                    val.skintone_computation === null ? val.skintone_score : val.skintone_computation;
                // sensitivity_scabs
                val.sensitivity_scabs_score =
                    val.sensitivity_scabs_score === null ? null : Number(val.sensitivity_scabs_score);
                val.sensitivity_scabs_computation =
                    val.sensitivity_scabs_computation === null
                        ? val.sensitivity_scabs_score
                        : val.sensitivity_scabs_computation;
                // sensitivity_scaling
                val.sensitivity_scaling_score =
                    val.sensitivity_scaling_score === null ? null : Number(val.sensitivity_scaling_score);
                val.sensitivity_scaling_computation =
                    val.sensitivity_scaling_computation === null
                        ? val.sensitivity_scaling_score
                        : val.sensitivity_scaling_computation;
                //moisture_u
                val.moisture_u_score = val.moisture_u_score === null ? null : Number(val.moisture_u_score);
                val.moisture_u_computation =
                    val.moisture_u_computation === null ? val.moisture_u_score : val.moisture_u_computation;
                // moisture_t_score
                val.moisture_t_score = val.moisture_t_score === null ? null : Number(val.moisture_t_score);
                val.moisture_t_computation =
                    val.moisture_t_computation === null ? val.moisture_t_score : val.moisture_t_computation;
                //sebum_u
                val.sebum_u_score = val.sebum_u_score === null ? null : Number(val.sebum_u_score);
                val.sebum_u_computation =
                    val.sebum_u_computation === null ? val.sebum_u_score : val.sebum_u_computation;

                // sebum_t
                val.sebum_t_score = val.sebum_t_score === null ? null : Number(val.sebum_t_score);
                val.sebum_t_computation =
                    val.sebum_t_computation === null ? val.sebum_t_score : val.sebum_t_computation;
            });

            return nonEmptyResults;
        } catch (error) {
            console.log(error);
            throw error;
        }

        // await this.getAnalysisByBatchId
    }

    async getImageData(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            SELECT  
                url,
                CASE
                    WHEN type_measurement_id = 1 THEN 'pores'
                    WHEN type_measurement_id = 2 THEN 'sensitivityscaling'
                    WHEN type_measurement_id = 3 THEN 'porphyrin'
                    WHEN type_measurement_id = 4 THEN 'wrinkles'
                    WHEN type_measurement_id = 5 THEN 'sebumU'
                    WHEN type_measurement_id = 6 THEN 'skintone'
                    WHEN type_measurement_id = 8 THEN 'spots'
                    WHEN type_measurement_id = 9 THEN 'sebumT'
                    WHEN type_measurement_id = 10 THEN 'shine'
                    WHEN type_measurement_id = 11 THEN 'keratin'
                    WHEN type_measurement_id = 12 THEN 'sensitivityredness'
                    WHEN type_measurement_id = 14 THEN 'sensitivityscabs'
                    WHEN type_measurement_id = 15 THEN 'sebum'
                    WHEN type_measurement_id = 16 THEN 'moistureT'
                    WHEN type_measurement_id = 17 THEN 'moistureU'
                END AS analysis_type,
                type_images.name as type,
                to_json ( scores ) ->> 'score' as score, 
                to_json(args) ->> 'nth_analysis' as hash,
                created_time
            FROM measurements record
            LEFT JOIN type_images ON type_images.ID = record.type_image_id 
            WHERE batch_id = $1 AND ( type_image_id = 18 OR type_image_id = 21);
            `,
            [batch_id],
        );
        return result;
    }

    async userAnalysisImageHistory(customer_id: number, per: number, page: number) {
        let batchIds = await this.getCustomerBatchID(customer_id, per, page);

        // const promises: Promise<any>[] = [];
        // // geting result
        // for (const batchId of batchIds) {
        //     console.log('===>', batchId['batch_id']);
        //     promises.push(this.getImageData(batchId['batch_id']));
        // }

        try {
            // const resultObj = await Promise.all(promises);

            // const image: any[] = [];
            const imagePromises: Promise<any>[] = batchIds.map(async (batchId: any) => {
                const rows = await this.getImageData(batchId['batch_id']);
                if (rows.length > 0) {
                    return {
                        batch_id: Number(batchId['batch_id']),
                        customer_id: customer_id,
                        images: [...rows],
                    };
                }
            });

            const image = await Promise.all(imagePromises);
            const result = image.filter((result) => result !== null);
            for (const entry of result) {
                const analyzedImages = entry.images.filter(
                    (image: any) => image.type === 'analyzedImage' && image.score === null,
                );

                for (const analyzedImage of analyzedImages) {
                    const { hash, analysis_type, url } = analyzedImage;
                    const originalImage = entry.images.find(
                        (image: any) =>
                            image.type === 'originalImage' &&
                            image.hash === hash &&
                            image.analysis_type === analysis_type,
                    );

                    if (originalImage) {
                        analyzedImage.score = originalImage.score;
                    }
                }
                entry.images.map((val: any) => {
                    if (val.url === null) {
                        val.url = '';
                    }
                    if (val.hash === null) {
                        val.hash = '';
                    }
                });
            }

            return result;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async userHistoryWithBatchId(batch_id: number) {
        try {
            const result = await this.database.executeQuery(
                `
            SELECT
                analysis_type,
                jsonb_agg ( TEMP ) 
            FROM
                (
                SELECT DISTINCT
                    record.analysis_type AS analysis_type,
                    jsonb_agg ( img ) AS images,
                    record.args AS args,
                    record.type_image,
                    record.DATE AS DATE,
                    record.TIME AS TIME 
                FROM
                    (
                    SELECT
                        tm."name" AS analysis_type,
                        type_image_id AS type_image,
                        type_measurement_id,
                        args ->> 'nth_analysis' as unique_id,
                        CASE
                            WHEN type_image_id = 21 THEN
                            scores 
                        END AS args,
                        created_time :: DATE AS DATE,
                        created_time :: TIME AS TIME,
                        batch_id 
                    FROM
                        measurements ms
                        LEFT JOIN type_measurements tm ON tm.ID = ms.type_measurement_id 
                    WHERE
                        (
                            type_measurement_id = 17
                            OR type_measurement_id = 16  
                            OR type_measurement_id = 9 
                            OR type_measurement_id = 5 
                            OR type_measurement_id = 11 
                            OR type_measurement_id = 1 
                            OR type_measurement_id = 3 
                            OR type_measurement_id = 15 
                            OR type_measurement_id = 12 
                            OR type_measurement_id = 14 
                            OR type_measurement_id = 2 
                            OR type_measurement_id = 6 
                            OR type_measurement_id = 8 
                            OR type_measurement_id = 4 
                        ) 
                        AND type_image_id = 21 
                        AND batch_id = $1 
                    ) AS record
                    LEFT JOIN (
                    SELECT
                        batch_id,
                        type_image_id,
                        type_measurement_id,
                        tpi.NAME AS TYPE,
                        scores || jsonb_build_object ( 'nth_analysis', to_json ( args ) ->> 'nth_analysis' ) AS args,
                        json_build_object ( 'id', to_json ( args ) ->> 'nth_analysis', 'url', url ) AS url,
                        args ->> 'nth_analysis' as unique_id 
                    FROM
                        measurements AS ms
                        LEFT JOIN type_images AS tpi ON tpi.ID = ms.type_image_id 
                    ) AS img ON img.batch_id = record.batch_id 
                    WHERE record.type_measurement_id = img.type_measurement_id 
                    AND (record.unique_id = img.unique_id OR record."analysis_type" = 'moistureT' OR record."analysis_type" = 'moistureU')
                GROUP BY
                    record.analysis_type,
                    record.args,
                    record.DATE,
                    record.TIME,
                    record.type_image 
                ) TEMP 
            GROUP BY
                analysis_type;
                
            `,
                [batch_id],
            );

            let respObj: any = {};
            for (let i = 0; i < result.length; i++) {
                let obj: any = {};
                for (let j = 0; j < result[i].jsonb_agg.length; j++) {
                    let imgObj: any = {};
                    for (let k = 0; k < result[i].jsonb_agg[j].images.length; k++) {
                        if (result[i].analysis_type === 'moistureT' || result[i].analysis_type === 'moistureU') {
                            continue;
                        }
                        imgObj[result[i].jsonb_agg[j].images[k].type] = { ...result[i].jsonb_agg[j].images[k].url };
                    }
                    if (!obj[result[i].analysis_type]) {
                        obj[result[i].analysis_type] = [
                            {
                                ...result[i].jsonb_agg[j].args,
                                analysis_type: result[i].jsonb_agg[j].analysis_type,
                                date: result[i].jsonb_agg[j].date,
                                time: result[i].jsonb_agg[j].time,
                                ...imgObj,
                            },
                        ];
                    } else {
                        obj[result[i].analysis_type] = [
                            ...obj[result[i].analysis_type],
                            {
                                ...result[i].jsonb_agg[j].args,
                                analysis_type: result[i].jsonb_agg[j].analysis_type,
                                date: result[i].jsonb_agg[j].date,
                                time: result[i].jsonb_agg[j].time,
                                ...imgObj,
                            },
                        ];
                    }
                }
                respObj = { ...respObj, ...obj };
            }

            respObj?.moistureT?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.moistureU?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });

            // if (respObj?.sebumU && Array.isArray(respObj?.sebumU)) {
            //     respObj.sebumU = respObj.sebumU[0];
            // }

            // if (respObj?.sebumT && Array.isArray(respObj?.sebumT)) {
            //     respObj.sebumT = respObj.sebumT[0];
            // }

            if (respObj?.moistureU && Array.isArray(respObj?.moistureU)) {
                respObj.moistureU = respObj.moistureU[0];
            }

            if (respObj?.moistureT && Array.isArray(respObj?.moistureT)) {
                respObj.moistureT = respObj.moistureT[0];
            }
            respObj?.sebumT?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.sebumU?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.keratin?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.moisture?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.pores?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.porphyrin?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.sebum?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.fullsensitivity?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.sensitivityredness?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.sensitivityscabs?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.sensitivityscaling?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.shine?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.skintone?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.spots?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.wrinkles?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });

            respObj?.pores?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            return respObj;
        } catch (e) {
            console.log(e);
        }
    }

    // MoistureU
    // CBB offline saving
    offlineCBBSaveData(imageRecords: any, dataObject: any[]) {
        if (!dataObject || dataObject.length === 0) {
            return;
        }

        const query = `
        INSERT INTO measurements
          (batch_id, url, sys_url, hash, type_measurement_id, type_image_id, args, scores)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

        for (const data of dataObject) {
            const values = [
                data.batch_id,
                data.url,
                data.sys_url,
                data.hash,
                data.type_measurement_id,
                data.type_image_id,
                data.args,
                data.scores,
            ];

            this.database.executeQuery(query, values);
        }

        // await this.batchAnalysis.updateEnvironment(data.batchId, environment);

        return 'saved';
    }

    async getAlgoID(algorithm: string): Promise<any[]> {
        const result = await this.database.executeQuery(
            `SELECT id FROM type_measurements WHERE name LIKE '${algorithm}'`,
        );

        return result;
    }

    async updateData(data: any, imageRecords: string) {
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
            consultant_id: data.consultant_id,
            email: data.email,
            app_id: data.app_id,
        };
        await this.updateEnvironment(data.batch_id, environment);
    }

    // Save Log for data upload faillure
    getErrorLog(batch_id: number) {
        const kr_time = new Date().toLocaleString();
        const errorLog = `batch id: ${batch_id} - Image upload failes\n\n
        ${JSON.stringify(kr_time)}\n\n`;

        return errorLog;
    }

    async countAnalysis(customer_ids: number[]) {
        try {
            const update = await this.database.executeQuery(
                `
                SELECT 
                CASE WHEN customer_id IS NULL THEN 'Total' ELSE CAST(customer_id AS TEXT) END AS customer,
                COUNT(*) AS count
                FROM analysis
                WHERE customer_id = ANY($1::int[])
                GROUP BY ROLLUP (customer_id);
            `,
                [customer_ids],
            );
            return update;
        } catch (e) {
            console.log('check', e);
            throw new Error();
        }
    }

    async fetchAgeCondition(batchId: number) {
        try {
            const update = await this.database.executeQuery(
                `
                SELECT
                    CASE
                        WHEN tp.id = 8 THEN  'spots'
                        WHEN tp.id = 4 THEN 'wrinkles'
                        WHEN tp.id = 16 THEN 'moistureT'
                        WHEN tp.id = 9 THEN 'sebumT'
                        WHEN tp.id = 17 THEN 'moistureU'
                        WHEN tp.id = 5 THEN 'sebumU'
                    END AS measurement,
                    CASE
                        WHEN tp.id = 8 THEN  round(AVG((to_json(scores) ->> 'computation_score')::numeric),2)
                        WHEN tp.id = 4 THEN round(AVG((to_json(scores) ->> 'computation_score')::numeric),2)
                        WHEN tp.id = 16 THEN round(AVG((to_json(scores) ->> 'score')::numeric),2)
                        WHEN tp.id = 9 THEN round(AVG((to_json(scores) ->> 'score')::numeric),2)
                        WHEN tp.id = 17 THEN round(AVG((to_json(scores) ->> 'score')::numeric),2)
                        WHEN tp.id = 5 THEN round(AVG((to_json(scores) ->> 'score')::numeric),2)
                    END AS AVG 
                FROM
                    measurements AS ms
                    JOIN type_measurements AS tp ON tp."id" = ms.type_measurement_id 
                WHERE
                    batch_id = $1 
                    AND type_image_id = 21 
                GROUP BY tp.NAME, tp.ID
            `,
                [batchId],
            );
            return update;
        } catch (e) {
            console.log('check', e);
            throw new Error();
        }
    }

    async fetchQuestion(batchId: number) {
        try {
            const result = await this.database.executeQuery(
                `
                SELECT
                    MAX(CASE
                    WHEN type_measurement_id = 8 THEN ((to_json(scores) ->> 'answers'))
                    WHEN type_measurement_id = 4 THEN ((to_json(scores) ->> 'answers'))
                        WHEN type_measurement_id = 1 THEN ((to_json(scores) ->> 'answers'))
                        WHEN type_measurement_id = 7 THEN ((to_json(scores) ->> 'answers'))
                        WHEN type_measurement_id = 11 THEN ((to_json(scores) ->> 'answers'))
                    END) AS answers
                FROM
                    measurements
                WHERE
                    batch_id = $1
                    AND type_image_id = 21
                    AND (to_json(scores) ->> 'answers') IS NOT NULL
                LIMIT 1	
            `,
                [batchId],
            );
            const finalRes = result[0].answers;
            return finalRes;
        } catch (e) {
            console.log('check', e);
            throw new Error();
        }
    }

    async skinAgeOperation(batchId: number) {
        const result = await this.fetchAgeCondition(batchId);

        let spots = null;
        let wrinkles = null;
        let moistureT = null;
        let sebumT = null;
        let moistureU = null;
        let sebumU = null;

        for (let i = 0; i < result.length; i++) {
            if (result[i]['measurement'] === 'spots') spots = result[i]['avg'];
            if (result[i]['measurement'] === 'wrinkles') wrinkles = result[i]['avg'];
            if (result[i]['measurement'] === 'moistureT') moistureT = result[i]['avg'];
            if (result[i]['measurement'] === 'sebumT') sebumT = result[i]['avg'];
            if (result[i]['measurement'] === 'moistureU') moistureU = result[i]['avg'];
            if (result[i]['measurement'] === 'sebumU') sebumU = result[i]['avg'];
        }

        return {
            spots: spots,
            wrinkles: wrinkles,
            moistureT: moistureT,
            sebumT: sebumT,
            moistureU: moistureU,
            sebumU: sebumU,
        };
    }

    async saveSkinValue(batch_id: number, skinCondtion: any, skinAge: any) {
        const condition = skinCondtion.length === 0 ? '-1' : skinCondtion;
        try {
            const update = `
                UPDATE measurements 
                SET scores =
                    CASE
                        WHEN scores ->> 'skinCondtion' IS NULL 
                        AND scores ->> 'skinAge' IS NULL THEN
                            jsonb_set ( jsonb_set ( scores, '{skinCondtion}', $1, TRUE ), '{skinAge}', $2, TRUE ) ELSE scores 
                    END 
                WHERE batch_id = $3 AND type_measurement_id = 5 AND type_image_id = 21
            `;

            this.database.executeQuery(update, [JSON.stringify(condition), JSON.stringify(skinAge), batch_id]);
            return update;
        } catch (e) {
            console.log('check', e);
        }
    }

    saveSkinCondtion(batch_id: number, skinCondtion: any, skinAge: any) {
        const condition = skinCondtion.length === 0 ? '-1' : skinCondtion;
        try {
            const update = `
                INSERT INTO measurements (batch_id, type_measurement_id, type_image_id, scores)
                VALUES ($3, 18, 21, '{"skinCondtion": $1, "skinAge": $2}')
            `;

            this.database.executeQuery(update, [JSON.stringify(condition), JSON.stringify(skinAge), batch_id]);
            return update;
        } catch (e) {
            console.log('check', e);
        }
    }

    async calculateRevisit(CUSTOMER_ID_LIST: number[], THIS_MONTH: string) {
        const query = `
                SELECT batch_id, customer_id, created_time
                FROM analysis
                WHERE customer_id = ANY($1)
            `;

        const result = await this.database.executeQuery(query, [CUSTOMER_ID_LIST]);

        console.log(result);
        const analysisData = result;

        const analysisDf = analysisData.map((row: any) => ({
            batch_id: row.batch_id,
            customer_id: row.customer_id,
            created_time: moment(row.created_time).format('YYYY-MM-DD'),
        }));

        const uniqueCustomerIds = [...new Set(analysisDf.map((row: any) => row.customer_id))];

        const revisitCountDict: Record<number, number> = {};
        const revisitDayTermDict: Record<number, number> = {};
        const revisitCountInThisMonthDict: Record<number, number> = {};

        for (const customerId of uniqueCustomerIds) {
            const customerDf = analysisDf.filter((row: any) => row.customer_id === customerId);
            const sortedCustomerDf = customerDf.sort((a: any, b: any) => {
                return moment(a.created_time).isBefore(moment(b.created_time)) ? -1 : 1;
            });

            const visitCount = sortedCustomerDf.length;

            if (revisitCountDict[visitCount - 1]) {
                revisitCountDict[visitCount - 1]++;
            } else {
                revisitCountDict[visitCount - 1] = 1;
            }

            if (visitCount > 1) {
                for (let i = 0; i < visitCount - 1; i++) {
                    const dayTerm = moment(sortedCustomerDf[i + 1].created_time).diff(
                        moment(sortedCustomerDf[i].created_time),
                        'days',
                    );

                    if (revisitDayTermDict[dayTerm]) {
                        revisitDayTermDict[dayTerm]++;
                    } else {
                        revisitDayTermDict[dayTerm] = 1;
                    }
                }
            }

            const revisitCountInThisMonth = sortedCustomerDf.filter((row: any) =>
                moment(row.created_time).isSame(THIS_MONTH, 'month'),
            ).length;

            if (revisitCountInThisMonthDict[revisitCountInThisMonth]) {
                revisitCountInThisMonthDict[revisitCountInThisMonth]++;
            } else {
                revisitCountInThisMonthDict[revisitCountInThisMonth] = 1;
            }
        }

        let revisitSum = 0;
        for (const key in revisitCountDict) {
            if (revisitCountDict.hasOwnProperty(key)) {
                revisitSum += Number(key) * revisitCountDict[key];
            }
        }

        console.log('revisitCountInThisMonthDict', revisitCountInThisMonthDict);
        console.log('revisitDayTermDict', revisitDayTermDict);
        console.log('revisitCountDict', revisitCountDict);
        console.log('revisitSum', revisitSum);
        return {
            revisitCountDict: revisitCountDict,
            revisitDayTermDict: revisitDayTermDict,
            revisitCountInThisMonthDict: revisitCountInThisMonthDict,
            revisitSum: revisitSum,
        };
    }

    isPrimitive(obj: any): boolean {
        return (typeof obj !== 'object' && typeof obj !== 'function') || obj === null;
    }

    // analysis Flag
    async analysisFlag(batch_id: number | string, status: any): Promise<any> {
        const stat = {
            status: status,
        };
        const result = await this.database.executeQuery(
            `
              UPDATE analysis
              SET args = args::jsonb || $1::jsonb
              WHERE batch_id = $2;
              `,
            [JSON.stringify(stat), batch_id],
        );

        console.log(result);

        return result;
    }

    decodeToken(token: any) {
        if (!token) {
            throw new UnauthorizedException(10002, 'You are unauthorized, try refreshing the page.');
        }
        // getting consultant information from Token
        const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const args = {
            consultant_id: decoded['consultant_id'],
            email: decoded['email'],
            app_id: decoded['app_id'],
            name: decoded['name'],
        };

        return args;
    }
}

