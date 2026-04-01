import { ConsoleLogger, Controller, Get, Res, Param, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import { WebResultService } from './webResult.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('WebResult')
@Controller('web-result')
export class WebResultController {
    private readonly logger = new ConsoleLogger(WebResultController.name);

    constructor(private readonly webResult: WebResultService) {}

    @Get('/cndpskin/:batch_id')
    async getBatchId(@Param('batch_id') batch_id: number, @Res() res: Response) {
        try {
            const result = await this.webResult.finaleWebResult(batch_id);

            return res.status(200).json({
                status: 200,
                service: 'getAnalysisData for WebResult',
                body: result,
            });
        } catch (e) {
            this.logger.error(`[getBatchId] ${e instanceof Error ? e.message : e}`);
            throw new InternalServerErrorException(e instanceof Error ? e.message : 'Failed to get web result.');
        }
    }
}
