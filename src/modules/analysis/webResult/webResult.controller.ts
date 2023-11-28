import { Controller, Body, Get, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { WebResultService } from './webResult.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('WebResult')
@Controller('web-result')
export class WebResultController {
    constructor(private readonly webResult: WebResultService) {}

    @Get('/cndpskin/:batch_id')
    async getBatchId(@Param('batch_id') batch_id: number, @Res() res: Response) {
        try {
            const result = await this.webResult.webResult(batch_id);

            const avg = await this.webResult.webResultAverage(batch_id);

            const skinAge = await this.webResult.getSkinAge(batch_id);

            // console.log(result);
            let moistureT = null;
            let moistureU = null;
            let sebumT = null;
            let sebumU = null;

            for (let i = 0; i < result.length; i++) {
                // console.log(result[i]['measurement'] === );
                if (result[i]['measurement'] === 'moistureT' || result[i]['measurement'] === 'moistureU') {
                    result[i]['analyzed_image_url'] = null;
                    result[i]['original_image_url'] = null;
                }

                result[i].value = +result[i].value;
                for (let j = 0; j < avg.length; j++) {
                    if (avg[j].measurement === 'moistureT') moistureT = avg[j].avg;
                    if (avg[j].measurement === 'moistureU') moistureU = avg[j].avg;
                    if (avg[j].measurement === 'sebumT') sebumT = avg[j].avg;
                    if (avg[j].measurement === 'sebumU') sebumU = avg[j].avg;

                    if (result[i]['measurement'] === avg[j].measurement) {
                        result[i]['avg_value'] = parseFloat(avg[j].avg);
                        // result[i]['computation_score'] = parseFloat(avg[i].computation_score);
                        result[i]['keyword_value'] = avg[j]['keyword_value'];
                        result[i]['keyword_id'] = parseFloat(avg[j].keyword_id);
                    }

                    if (result[i]['computation_score']) {
                        result[i]['computation_score'] = Number(result[i]['computation_score']);
                    }
                }
            }

            const condition = this.webResult.skinCondition(
                Number(moistureT),
                Number(moistureU),
                Number(sebumT),
                Number(sebumU),
            );
            const conditionResult = this.webResult.check(condition.moisture, condition.sebum);

            if (moistureT !== null || moistureU !== null || sebumT !== null || sebumU !== null) {
                result.push({
                    measurement: 'Skin Condition',
                    value: null,
                    date: null,
                    time: null,
                    original_image_url: null,
                    analyzed_image_url: null,
                    avg_value: null,
                    keyword_value: conditionResult.keyword_value,
                    keyword_id: conditionResult.keyword_id,
                });
            }

            if (skinAge[0]?.skin_age) {
                result.push({
                    measurement: 'SkinAge',
                    value: Number(skinAge[0]?.skin_age),
                    date: skinAge[0]?.date,
                    time: skinAge[0]?.time,
                    original_image_url: null,
                    analyzed_image_url: null,
                    avg_value: null,
                    keyword_value: Number(skinAge[0]?.skin_age),
                    keyword_id: null,
                });
            }
            return res.status(200).json({
                status: 200,
                service: 'getAnalysisData for WebResult',
                body: result,
            });
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }
}

