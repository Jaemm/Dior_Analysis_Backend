import {
    Controller,
    Get,
    Res,
    Param,
    Query,
    ConsoleLogger,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { AnanalysisHistoryService } from './customerHistory.service';

@ApiTags('Customer')
@Controller('cndpskin')
export class AnanalysisHistoryController {
    private readonly logger = new ConsoleLogger(AnanalysisHistoryController.name);

    constructor(private readonly getAnalysisHistory: AnanalysisHistoryService) {}

    @ApiExcludeEndpoint()
    @Get('/:customer_id/analysis-history/')
    async getcustomerHistory(
        // @Body() data: GetcustomerHistoryDTO,
        @Param('customer_id') customer_id: number,
        @Query() query: GetcustomerHistoryDTO,
        @Res() res: Response,
    ) {
        const result = await this.getAnalysisHistory.GetcustomerHistory(customer_id, query);

        return res.status(200).send(result);
    }

    @ApiExcludeEndpoint()
    @Get('/:customer_id/analysis-history/details')
    async getcustomerHistoryDetail(@Res() res: Response, @Query() query: GetcustomerHistoryDTO) {
        const result = await this.getAnalysisHistory.getcustomerHistoryDetail(query);

        return res.status(200).send(result);
    }

    @ApiExcludeEndpoint()
    @Get('/:customer_id/analysis-history/analysis-infor')
    async getcustomerAnalysisInfor(@Query() query: any, @Res() res: Response) {
        try {
            const { batch_id } = query;
            const result = await this.getAnalysisHistory.analysisInfor(Number(batch_id));
            return res.status(200).send({
                status: 200,
                service: 'Customer Analysis History Details',
                data: result,
            });
        } catch (error) {
            this.logger.error(`[getcustomerAnalysisInfor] ${error instanceof Error ? error.message : error}`);
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }
}
