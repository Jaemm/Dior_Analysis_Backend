import { Controller, Body, Get, Post, UseInterceptors, UploadedFiles, Res, Param, Query,  } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { HistoryService } from './history.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, response, Response  } from 'express';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { PaginationParams } from 'src/common/Dto/pagination/paginationParams';

@Controller('history')
export class HistoryController {
    constructor(
        private readonly getHistory: HistoryService,
        private readonly fileUpload: FileUploadService,
    ){}


    @Get('/singleBatch/:batchId')
    async getBatchId(@Param('batchId') batchId: number, @Res() res: Response) {
        try{
            const result = await this.getHistory.getSingleAnalysis(Number(batchId))
            return res.status(200).json({
                status: 200,
                service: "getBatchId",
                batch_id: result,
            })
        }catch(e){
            throw new Error(e)
        }
    }

    @Get('/getCustomerAnalysis/:customer_id')
    async getCustomerAnalysis(
        @Param('customer_id') customer_id: number,
        @Res() res: Response,
        @Query() {offset, limit}: PaginationParams
    ) {
        console.log("PaginationParams", offset, limit)
        try{
            const result = await this.getHistory.getCustomerAnalysis(Number(customer_id), offset, limit)
            return res.status(200).json({
                status: 200,
                service: "getCustomerAnalysis",
                ...result,
            })
        }catch(e){
            throw new Error(e)
        }
    }

}