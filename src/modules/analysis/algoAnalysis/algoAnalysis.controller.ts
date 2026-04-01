import {
    Controller,
    Body,
    Get,
    Post,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Res,
    Param,
    Query,
    HttpException,
    HttpCode,
    UseGuards,
    Delete,
    Req,
    HttpStatus,
    ConsoleLogger,
    InternalServerErrorException,
} from '@nestjs/common';
import * as celery from 'celery-node';
import { Request, Response } from 'express';
import { AlgoAnalysisService } from './algoAnalysis.service';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import {
    AlgoAnalysisDTO,
    BatchIdCheckerDto,
    allCustomerDto,
    countCustomerDto,
    historyDTO,
    paginationDTO,
} from 'src/common/Dto/analysis/algoAnalysis.dto';
import { MoistureDTO, SaveFlagDto } from 'src/common/Dto/analysis/moisture.dto';
import { v4 as uuidv4 } from 'uuid';
import { MoistureUService } from 'src/modules/algorithms/moistureU/moistureU.service';
import { MoistureTService } from 'src/modules/algorithms/moistureT/moistureT.service';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { SebumUService } from 'src/modules/algorithms/sebumU/sebumU.service';
import { SebumTService } from 'src/modules/algorithms/sebumT/sebumT.service';
import { SkinToneDiorService } from 'src/modules/algorithms/skinToneDior/skinToneDior.service';
import { OfflineDataCBBDTO, SkinToneDTO, SkinToneUploadDTO } from 'src/common/Dto/analysis/offlineData.dto';
import { AuthMiddleware } from 'src/common/middleWare/authMiddlware/auth.middleware';
import { BatchAnalysisService } from '../batchAnalysis/batchAnalysis.service';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiExcludeEndpoint,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import * as fs from 'fs';

@ApiTags('Analysis')
@Controller('analysis')
// @UseGuards(AuthMiddleware)
// @ApiBearerAuth('access-token')
export class AlgoAnalysisController {
    private readonly logger = new ConsoleLogger(AlgoAnalysisController.name);

    constructor(
        private readonly AlgoAnalysis: AlgoAnalysisService,
        private readonly moisture_u: MoistureUService,
        private readonly moisture_t: MoistureTService,
        private readonly sebum_u: SebumUService,
        private readonly sebum_t: SebumTService,
        private readonly S3Image: FileUploadService,
        private readonly diorTone: SkinToneDiorService,
        private readonly batchAnalysis: BatchAnalysisService,
    ) {}

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Single analysis, Expecting a single image per analysis.',
        security: [{ bearerToken: [] }],
    })
    @ApiBody({ type: AlgoAnalysisDTO })
    @Post('')
    @HttpCode(200)
    @UseInterceptors(FileInterceptor('image'))
    async getcustomerHistory(
        @Body() data: any,
        @UploadedFile() image: Express.Multer.File,
        @Res() res: Response,
        @Req() req: Request,
    ) {
        if (!image)
            return res.send({
                status: 40002,
                type: 'BadRequestError',
                message: 'No file!',
            });

        data.batch_id = Number(data.batch_id);

        const imageRecords = uuidv4();
        const client = celery.createClient('redis://localhost', 'redis://');
        let algoList = [
            'keratin',
            'pores',
            'porphyrin',
            'sebum',
            'shine',
            'spots',
            'skintone',
            'wrinkles',
            'sensitivityscabs',
            'sensitivityscaling',
            'sensitivityredness',
        ];
        if (!algoList.includes(data.type)) {
            throw new HttpException(`We don't have such type of algorithm -> ${data.type}`, 40001);
        }
        // console.time('celery');
        const originalImage = image.buffer.toString('base64');

        data.task = this.AlgoAnalysis.getTaskByAlgoType(data.type);

        const task = client.createTask(data.task.taskName);

        let result: any;

        if (data.task.taskName === 'CNDP_SkinTone') {
            result = task.applyAsync([originalImage, process.env.skinToneFile]);
        } else if (data.task.taskName === 'CNDP_FitzSG') {
            result = task.applyAsync([originalImage, process.env.skinToneFile]);
        } else {
            result = task.applyAsync([originalImage]);
        }

        const taskResponse = await result?.get();

        if (taskResponse.err) {
            return res.send({
                status: 40004,
                service: `analysis - ${data.task.taskName}`,
                message: 'Internal server error.',
                error: taskResponse.err,
            });
        }
        const imageArg = this.AlgoAnalysis.handleImageArg(data);

        const result_ = await this.AlgoAnalysis.finalAnalysis(data, imageRecords, taskResponse, imageArg);
        // const computation = this.computation.computationResult(data.type, data.answers, result_.score);
        // result_.computation_score = computation['computation_score'];
        // result_.questionnaire_score = computation['questionnaire_score'];

        // result_.computation = computation;
        let promise1 = new Promise(function (resolve, reject) {
            resolve(
                res.status(200).json({
                    status: 200,
                    message: 'Success',
                    body: result_,
                }),
            );
        });
        const computaionResutl: any = {};
        const token = req.headers.authorization?.split(' ')[1];

        const args = this.AlgoAnalysis.decodeToken(token);
        data.consultant_id = args.consultant_id;
        data.email = args.email;
        data.app_id = args.app_id;
        data.name = args.name;

        const saving = await this.AlgoAnalysis.finalSave(
            computaionResutl,
            data,
            image,
            imageRecords,
            taskResponse,
            imageArg,
        );
        let promise2 = new Promise(function (resolve, resject) {
            resolve(saving);
        });

        promise1
            .then(function (value) {
                return promise2;
            })
            .catch((error) => {
                this.logger.error(`[analysis] ${error instanceof Error ? error.message : error}`);
                return res.send({
                    status: 500,
                    type: 'InternalServerError',
                    message: 'Internal server error.',
                    error: error.message,
                });
            });
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Get('/getAnalysisData/:batch_id')
    async getAnalysisData(@Param('batch_id') batch_id: number, @Res() res: Response) {
        try {
            const result = await this.AlgoAnalysis.getAnalysisData(batch_id);

            const image = await this.AlgoAnalysis.getImageByBatch(batch_id);

            if (image.length > 0) {
                result['images'] = image;
            }
            return res.status(200).json({
                status: 200,
                service: 'getAnalysisData',
                body: result,
            });
        } catch (error) {
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Post('/history/')
    async userAnalysisHistory(@Query() param: paginationDTO, @Res() res: Response, @Body() body: historyDTO) {
        let { per, page } = param;

        let { customer_id } = body;

        this.AlgoAnalysis.userAnalysisHistory(Number(customer_id), Number(per), Number(page))
            .then((data) => {
                return res.status(200).json({
                    status: 200,
                    msg: 'Success',
                    service: 'getUserAnalysisHistory',
                    body: {
                        rest_items: data?.length,
                        current_page: page,
                        analysis_list: data,
                    },
                });
            })
            .catch((error) => {
                return res.send({
                    status: 500,
                    type: 'InternalServerError',
                    message: 'Internal server error.',
                    error: error.message,
                });
            });
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Post('/history/image')
    async userAnalysisImageHistory(@Query() param: paginationDTO, @Res() res: Response, @Body() body: historyDTO) {
        let { per, page } = param;

        let { customer_id } = body;
        try {
            const data = await this.AlgoAnalysis.userAnalysisImageHistory(
                Number(customer_id),
                Number(per),
                Number(page),
            );

            return res.status(200).json({
                status: 200,
                msg: 'Success',
                service: 'getUserAnalysisImageHistory',
                body: data,
            });
        } catch (error) {
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Get('/history/result')
    async userAnalysisImageHistoryWithBatchId(@Query() param: BatchIdCheckerDto, @Res() res: Response) {
        let { batch_id } = param;

        // let { customer_id } = body;
        try {
            const data = await this.AlgoAnalysis.userHistoryWithBatchId(Number(batch_id));

            return res.status(200).json({
                status: 200,
                msg: 'Success',
                service: 'getUserAnalysisImageHistory',
                body: data,
            });
        } catch (error) {
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MoistureDTO })
    @Post('/moistureU')
    async moistureU(@Res() res: Response, @Body() body: any) {
        try {
            this.moisture_u.saveData(body);

            return res.status(201).send({
                status: 200,
                service: 'Analysis CNDP SKIN Moisture U',
                body: {
                    batch_id: Number(body.batch_id),
                    args: {
                        score: body.score,
                        raw: body.raw,
                    },
                },
            });
        } catch (error) {
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MoistureDTO })
    @Post('/moistureT')
    async moistureT(@Res() res: Response, @Body() body: any) {
        try {
            this.moisture_t.saveData(body);

            return res.status(201).send({
                status: 200,
                service: 'Analysis CNDP SKIN Moisture T',
                body: {
                    batch_id: Number(body.batch_id),
                    args: {
                        score: body.score,
                        raw: body.raw,
                    },
                },
            });
        } catch (error) {
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    // @ApiExcludeEndpoint()
    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: SaveFlagDto })
    @Post('/analysisFlag')
    async analysisFlag(@Res() res: Response, @Body() body: any) {
        try {
            const { batch_id, status } = body;
            if (!batch_id) {
                return res.status(400).send({
                    status: 20001,
                    service: 'analysisFlag',
                    message: 'customer_id missing in URL query',
                });
            }
            let batchId = await this.AlgoAnalysis.analysisFlag(batch_id, status);
            return res.status(201).send({
                status: 200,
                service: 'Successful Analysis Flag saving',
                message: `Data saved for batch_id ${batch_id}`,
            });
        } catch (error) {
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                // error: error.exc_message,
                // err: error.message
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MoistureDTO })
    @Post('/sebumU')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 1 },
            { name: 'analyzedImage', maxCount: 1 },
        ]),
    )
    async sebumU(
        @Res() res: Response,
        @Body() body: any,
        @UploadedFiles()
        file: { originalImage: Express.Multer.File[]; analyzedImage: Express.Multer.File[] },
    ) {
        if (!file['originalImage'][0] || !file['analyzedImage'][0])
            return res.send({ status: 40002, type: 'BadRequestError', message: 'There is no necassary image file!' });

        const imageRecords = uuidv4();

        const originalImage = file.originalImage[0].buffer;
        const analyzedImage = file.analyzedImage[0].buffer;

        const analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', '', 'sebumU');

        const originalImageArgs = this.S3Image.getImageArgs('originalImage', '', 'sebumU');

        await this.sebum_u.saveData(body, analyzedImageArgs, originalImageArgs, imageRecords);

        let promise1 = new Promise(function (resolve, reject) {
            resolve(
                res.send({
                    status: 200,
                    service: 'Analysis CNDP SKIN Sebum U',
                    body: {
                        batch_id: Number(body.batch_id),
                        args: {
                            score: body.score,
                            raw: body.raw,
                        },
                        originalImage: {
                            id: originalImageArgs.hash,
                            url: originalImageArgs.url,
                        },
                        analyzedImage: {
                            id: analyzedImageArgs.hash,
                            url: analyzedImageArgs.url,
                        },
                    },
                }),
            );
        });

        await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);
        const saving = await this.S3Image.uploadImage(originalImage, originalImageArgs.sys_url);
        let promise2 = new Promise(function (resolve, resject) {
            resolve(saving);
        });

        promise1
            .then(function (value) {
                return promise2;
            })
            .catch((error) => {
                return res.send({
                    status: 500,
                    type: 'InternalServerError',
                    message: 'Internal server error.',
                    error: error.message,
                });
            });
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MoistureDTO })
    @Post('/sebumT')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 1 },
            { name: 'analyzedImage', maxCount: 1 },
        ]),
    )
    async sebumT(
        @Res() res: Response,
        @Body() body: any,
        @UploadedFiles()
        file: { originalImage: Express.Multer.File[]; analyzedImage: Express.Multer.File[] },
    ) {
        body.batchId = Number(body.batch_id);
        if (!file['originalImage'][0] || !file['analyzedImage'][0])
            return res.send({ status: 40002, type: 'BadRequestError', message: 'There is no necassary image file!' });
        const imageRecords = uuidv4();

        const originalImage = file.originalImage[0].buffer;
        const analyzedImage = file.analyzedImage[0].buffer;

        const analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', '', 'sebumT');

        const originalImageArgs = this.S3Image.getImageArgs('originalImage', '', 'sebumT');

        await this.sebum_t.saveData(body, analyzedImageArgs, originalImageArgs, imageRecords);

        let promise1 = new Promise(function (resolve, reject) {
            resolve(
                res.send({
                    status: 200,
                    service: 'Analysis CNDP SKIN Sebum T',
                    body: {
                        batch_id: Number(body.batch_id),
                        args: {
                            score: body.score,
                            raw: body.raw,
                        },
                        originalImage: {
                            id: originalImageArgs.hash,
                            url: originalImageArgs.url,
                        },
                        analyzedImage: {
                            id: analyzedImageArgs.hash,
                            url: analyzedImageArgs.url,
                        },
                    },
                }),
            );
        });

        await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);
        const saving = await this.S3Image.uploadImage(originalImage, originalImageArgs.sys_url);
        let promise2 = new Promise(function (resolve, resject) {
            resolve(saving);
        });

        promise1
            .then(function (value) {
                return promise2;
            })
            .catch((error) => {
                return res.send({
                    status: 500,
                    type: 'InternalServerError',
                    message: 'Internal server error.',
                    error: error.message,
                });
            });
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: SkinToneDTO })
    @Post('/skintone-dior')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
        ]),
    )
    async skinToneDior(
        @Res() res: Response,
        @Body() body: any,
        @UploadedFiles()
        file: { image1: Express.Multer.File[]; image2: Express.Multer.File[] },
    ) {
        try {
            if (!file['image1'][0] || !file['image2'][0])
                return res.send({
                    status: 40002,
                    type: 'BadRequestError',
                    message: 'There is no necassary image file!',
                });

            body.batch_id = Number(body.batch_id);
            const imageRecords = uuidv4();
            const client = celery.createClient('redis://localhost', 'redis://');
            const originalImageFirst = file.image1[0].buffer.toString('base64');
            const originalImageSecond = file.image2[0].buffer.toString('base64');
            body.type = 'skintone_dior';
            body.task = this.AlgoAnalysis.getTaskByAlgoType('skintone_dior');

            const originalImageFirstArgs = this.S3Image.getImageArgs('originalImage', body.type, body.task);

            const originalImageSecondArgs = this.S3Image.getImageArgs('originalImage', body.type, body.task);

            const task = client.createTask(body.task.taskName);

            let result = task.applyAsync([
                originalImageFirst,
                originalImageSecond,
                '/home/ubuntu/repositories/cfa-python/CNDP/files/chart.png',
            ]);

            const taskResponse = await result.get();

            if (taskResponse.err) {
                return res.send({
                    status: 40004,
                    service: `analysis - ${body.task.taskName}`,
                    message: 'Internal server error.',
                    error: taskResponse.err,
                });
            }
            const result_ = await this.diorTone.analysis(
                body,
                taskResponse,
                originalImageFirstArgs,
                originalImageSecondArgs,
            );
            let promise1 = new Promise(function (resolve, reject) {
                resolve(res.send({ status: 200, message: 'Success', body: result_ }));
            });

            const saving = await this.diorTone.saveData(
                body,
                imageRecords,
                taskResponse,
                originalImageFirst,
                originalImageSecond,
                originalImageFirstArgs,
                originalImageSecondArgs,
            );
            let promise2 = new Promise(function (resolve, resject) {
                resolve(saving);
            });

            promise1
                .then(function (value) {
                    return promise2;
                })
                .catch((error) => {
                    return res.send({
                        status: 500,
                        type: 'InternalServerError',
                        message: 'Internal server error.',
                        error: error.message,
                    });
                });
        } catch (error) {
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Get('/requestBatchId')
    async getBatchId(@Query() param: historyDTO, @Res() res: Response, @Req() req: Request) {
        try {
            let { customer_id, analysis_time } = param;

            let timeOfAnalysis;
            if (analysis_time) {
                timeOfAnalysis = analysis_time;
            } else {
                timeOfAnalysis = this.AlgoAnalysis.formatDate(new Date());
            }

            if (!customer_id) {
                return res.status(400).send({
                    status: 20001,
                    service: 'requestBatchId',
                    message: 'customer_id missing in URL query',
                });
            }

            const token = req.headers.authorization?.split(' ')[1];

            const args = this.AlgoAnalysis.decodeToken(token);

            const insert = await this.batchAnalysis.insertInAnalysis(customer_id, timeOfAnalysis, JSON.stringify(args));

            return res.status(200).json({
                status: 200,
                service: 'requestBatchId',
                body: { batch_id: insert },
            });
        } catch (e) {
            this.logger.error(`[requestBatchId] ${e instanceof Error ? e.message : e}`);
            throw new InternalServerErrorException(e instanceof Error ? e.message : 'Failed to request batch id.');
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Delete('/deleteAnalysisData/:batch_id')
    async deleteBatch(@Param('batch_id') batch_id: number, @Res() res: Response) {
        try {
            const result = await this.batchAnalysis.deleleBatch(batch_id);

            return res.status(200).json({
                status: 200,
                type: 'DeleteAnalysisData',
                message: 'Successfully Deleted.',
            });
        } catch (error) {
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @ApiOperation({
        summary: `data upload is the new API for saving offline analysis data.`,
        security: [{ bearerToken: [] }],
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: OfflineDataCBBDTO })
    @ApiResponse({
        status: 200,
        description: 'Success',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'number', example: 200 },
                service: { type: 'string', example: 'Success' },
                message: { type: 'string', example: 'Data saved to the cloud' },
            },
        },
    })
    @ApiBearerAuth('access-token')
    @Post('dataUpload')
    @HttpCode(200)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 5 },
            { name: 'analyzedImage', maxCount: 5 },
        ]),
    )
    async offlineBBC(
        @Body() data: any,
        @UploadedFiles() files: { analyzedImage: Express.Multer.File[]; originalImage: Express.Multer.File[] },
        @Res() res: Response,
        @Req() req: Request,
    ) {
        try {
            if (!files?.analyzedImage || !files?.originalImage) {
                return res.status(HttpStatus.BAD_REQUEST).send({
                    status: 40002,
                    type: 'BadRequestError',
                    message: 'No file!',
                });
            }

            if (files?.analyzedImage.length !== files?.originalImage.length) {
                return res.status(HttpStatus.BAD_REQUEST).send({
                    status: 40002,
                    type: 'BadRequestError',
                    message: 'The number of analyzed images does not match number of original images',
                });
            }
            const token = req.headers.authorization?.split(' ')[1];
            const result = await this.AlgoAnalysis.offlineBBC(data, files, token);

            res.status(201).send(result);
        } catch (error) {
            this.logger.error(`[dataUpload] ${error instanceof Error ? error.message : error}`);
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiExcludeEndpoint()
    @ApiBearerAuth('access-token')
    @Post('/countConsultation')
    async analysisCount(@Body() body: countCustomerDto, @Res() res: Response) {
        try {
            let { customer_ids } = body;

            const insert = await this.AlgoAnalysis.countAnalysis(customer_ids);

            return res.status(200).json({
                status: 200,
                service: 'requestBatchId',
                body: { batch_id: insert },
            });
        } catch (e) {
            this.logger.error(`[countConsultation] ${e instanceof Error ? e.message : e}`);
            throw new InternalServerErrorException(
                e instanceof Error ? e.message : 'Failed to count consultation.',
            );
        }
    }

    @ApiExcludeEndpoint()
    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Post('/allConsultation')
    async calculateRevisit(@Res() res: Response, @Body() body: allCustomerDto) {
        try {
            let { customer_ids, month } = body;

            const result = await this.AlgoAnalysis.calculateRevisit(customer_ids, month);

            return res.status(200).json({
                status: 200,
                service: 'requestBatchId',
                body: { result: result },
            });
        } catch (e) {
            this.logger.error(`[allConsultation] ${e instanceof Error ? e.message : e}`);
            throw new InternalServerErrorException(
                e instanceof Error ? e.message : 'Failed to calculate revisit data.',
            );
        }
    }

    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: SkinToneUploadDTO })
    @ApiResponse({
        status: 200,
        description: 'Success',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'number', example: 200 },
                service: { type: 'string', example: 'Success' },
                message: { type: 'string', example: 'Data saved to the cloud' },
            },
        },
    })
    @ApiBearerAuth('access-token')
    @Post('saveSkinTone')
    @HttpCode(200)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'image1', maxCount: 5 },
            { name: 'image2', maxCount: 5 },
        ]),
    )
    async offlineSkinTone(
        @Body() data: any,
        @UploadedFiles()
        files: { image1: Express.Multer.File[]; image2: Express.Multer.File[] },
        @Res() res: Response,
        @Req() req: Request,
    ) {
        try {
            if (!files?.image1 || !files?.image2) {
                return res.status(HttpStatus.BAD_REQUEST).send({
                    status: 40002,
                    type: 'BadRequestError',
                    message: 'No file!',
                });
            }

            if (files.image1.length !== files.image2.length) {
                return res.status(HttpStatus.BAD_REQUEST).send({
                    status: 40002,
                    type: 'BadRequestError',
                    message: 'The number of analyzed images does not match number of original images',
                });
            }

            // batch_id 정리
            data.batch_id = Number(data.batchId);

            // algorithmId 고정
            const algoId = 8;
            data.algorithmId = algoId;

            const analyzed: any[] = [];
            const original: any[] = [];
            const uploadPromises = [];

            const imageRecords = uuidv4();

            data.is_ngdevice = String(data.is_ngdevice).toLowerCase() === 'true';

            // 공통 scores payload
            const scorePayload = JSON.stringify({
                shade: data.shade,
                raw1: data.raw1 ?? null,
                raw2: data.raw2 ?? null,
                averageR: data.averageR ?? null,
                averageG: data.averageG ?? null,
                averageB: data.averageB ?? null,
                is_ngdevice: data.is_ngdevice ?? false,
            });

            // 공통 args payload
            const argsPayload = JSON.stringify({
                nth_analysis: imageRecords,
            });

            for (let i = 0; i < files.image1.length; i++) {
                const imageArg = this.AlgoAnalysis.handleCBBImageArg(data);

                // analyzed row
                analyzed.push([
                    data.batch_id,
                    imageArg.analyzedImageArgs.url,
                    imageArg.analyzedImageArgs.sys_url,
                    imageArg.analyzedImageArgs.hash,
                    algoId,
                    18,
                    argsPayload,
                    scorePayload,
                ]);

                // original row
                original.push([
                    data.batch_id,
                    imageArg.originalImageArgs.url,
                    imageArg.originalImageArgs.sys_url,
                    imageArg.originalImageArgs.hash,
                    algoId,
                    21,
                    argsPayload,
                    scorePayload,
                ]);

                // S3 upload
                uploadPromises.push(
                    this.S3Image.uploadFileToS3(files.image1[i].buffer, imageArg.originalImageArgs.sys_url),
                );

                uploadPromises.push(
                    this.S3Image.uploadFileToS3(files.image2[i].buffer, imageArg.analyzedImageArgs.sys_url),
                );
            }

            const saveOriginal = original.map((item) => ({
                batch_id: item[0],
                url: item[1],
                sys_url: item[2],
                hash: item[3],
                type_measurement_id: item[4],
                type_image_id: item[5],
                args: item[6],
                scores: item[7],
            }));

            const saveAnalyzed = analyzed.map((item) => ({
                batch_id: item[0],
                url: item[1],
                sys_url: item[2],
                hash: item[3],
                type_measurement_id: item[4],
                type_image_id: item[5],
                args: item[6],
                scores: item[7],
            }));

            const savedResult = [...saveAnalyzed, ...saveOriginal];

            this.AlgoAnalysis.offlineCBBSaveData(imageRecords, savedResult);

            Promise.all(uploadPromises).catch(() => {
                fs.appendFile('error.log', this.AlgoAnalysis.getErrorLog(data.batch_id), 'utf8', () => {});
            });

            // 토큰 정보 decode
            const token = req.headers.authorization?.split(' ')[1];
            const args = this.AlgoAnalysis.decodeToken(token);

            data.consultant_id = args.consultant_id;
            data.email = args.email;
            data.app_id = args.app_id;
            data.name = args.name;

            //  NG Device 이메일 발송
            if (data.is_ngdevice) {
                try {
                    await this.AlgoAnalysis.sendNgDeviceAlertMail({
                        consultant_id: data.consultant_id,
                        email: data.email,
                        app_id: data.app_id,
                        name: data.name,
                        batch_id: data.batch_id,
                        optic_number: data.optic_number,
                    });
                } catch (mailErr) {
                    this.logger.error(
                        `[saveSkinTone][mail] ${mailErr instanceof Error ? mailErr.message : mailErr}`,
                    );
                }
            }

            // update 처리
            await this.AlgoAnalysis.updateData(data, imageRecords);

            // 클라이언트 응답
            res.status(200).send({
                status: 200,
                service: 'Offline Analysis Data saving',
                message: 'Data saved to the cloud',
            });
        } catch (error) {
            this.logger.error(`[saveSkinTone] ${error instanceof Error ? error.message : error}`);
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
