import { ConsoleLogger, Controller, Body, Res, Post } from '@nestjs/common';
import { Response } from 'express';
import { QuestionsService } from './questions.service';
import { ApiTags } from '@nestjs/swagger';
import { QuestionDTO } from 'src/common/Dto/questions/question.dto';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
    private readonly logger = new ConsoleLogger(QuestionsController.name);

    constructor(private readonly QuestionsRepo: QuestionsService) {}

    @Post('/save')
    async saveQuestion(@Body() body: QuestionDTO, @Res() res: Response) {
        try {
            const checkAnswerExist = await this.QuestionsRepo.getAnswerList(Number(body.batch_id));
            if (checkAnswerExist.length > 0) {
                return res.status(400).send({
                    status: 400,
                    service: 'Questionnaire',
                    error: 'This batch_id has already been used for questionnaire',
                });
            }

            const results = await this.QuestionsRepo.saveAnswerList(
                Number(body.batch_id),
                String(body.answers),
                body?.args || null,
            );

            return res.status(200).send({
                status: 200,
                service: 'Questionnaire',
                message: 'Answers saved',
                data: results,
            });
        } catch (error: any) {
            this.logger.error(`[saveQuestion] ${error instanceof Error ? error.message : error}`);
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }
}
