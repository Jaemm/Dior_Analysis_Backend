import { ConsoleLogger, Controller, Get, Res, Param, Query, InternalServerErrorException } from '@nestjs/common';
import { HistoryService } from './history.service';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { PaginationParams } from 'src/common/Dto/pagination/paginationParams';

@Controller('history')
export class HistoryController {
    private readonly logger = new ConsoleLogger(HistoryController.name);

    constructor(private readonly getHistory: HistoryService, private readonly fileUpload: FileUploadService) {}

    @ApiExcludeEndpoint()
    @Get('/singleBatch/:batchId')
    async getBatchId(@Param('batchId') batchId: number, @Res() res: Response) {
        try {
            const result = await this.getHistory.getSingleAnalysis(Number(batchId));
            return res.status(200).json({
                status: 200,
                service: 'getBatchId',
                batch_id: result,
            });
        } catch (e) {
            this.logger.error(`[getBatchId] ${e instanceof Error ? e.message : e}`);
            throw new InternalServerErrorException(e instanceof Error ? e.message : 'Failed to get batch data.');
        }
    }

    @ApiExcludeEndpoint()
    @Get('/getCustomerAnalysis/:customer_id')
    async getCustomerAnalysis(
        @Param('customer_id') customer_id: number,
        @Res() res: Response,
        @Query() { offset, limit }: PaginationParams,
    ) {
        try {
            const result = await this.getHistory.getCustomerAnalysis(Number(customer_id), offset, limit);
            return res.status(200).json({
                status: 200,
                service: 'getCustomerAnalysis',
                ...result,
            });
        } catch (e) {
            this.logger.error(`[getCustomerAnalysis] ${e instanceof Error ? e.message : e}`);
            throw new InternalServerErrorException(
                e instanceof Error ? e.message : 'Failed to get customer analysis history.',
            );
        }
    }
}
