import { ConsoleLogger, Controller, Body, Get, Post, Res, Param, Headers, InternalServerErrorException } from '@nestjs/common';
import { ProductRecommendationService } from './productRecommendation.service';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { EmailService } from '../email/email.service';
import { ProductRecommendationEmailDto } from 'src/common/Dto/email/email.dto';

@Controller('productRecommendation')
@ApiTags('Product Recommendation')
export class ProductRecommendationController {
    private readonly logger = new ConsoleLogger(ProductRecommendationController.name);

    constructor(private readonly recommendation: ProductRecommendationService, private readonly email: EmailService) {}

    @Post('')
    async getProductByEmail(
        @Body() body: ProductRecommendationEmailDto,
        @Headers('x-locale') locale: string,
        // 기존 앱 호환
        @Headers('x-chowis-locale') chowisLocale: string,
        @Res() res: Response,
    ) {
        try {
            let language = locale ?? chowisLocale ?? 'en';
            if (language.length > 4 || language.length < 1) language = 'en';

            const productOrder = await this.recommendation.scoresSorting(body.batchId, language);
            const productRec = await this.recommendation.getRecommendedProduct(body.batchId, language);

            if (productOrder.length < 5 || productRec.length === 0) {
                return res.status(400).json({
                    status: 400,
                    service: 'getBatchId',
                    message: 'Result not found, email not send',
                });
            }

            /* -------------------------------
           동점 strength 계산 (핵심)
            -------------------------------- */

            // 점수가 낮을수록 좋다고 가정
            const bestScore = Math.min(...productOrder.map((p:any) => p.value));

            const strengthMeasurements = productOrder.filter((p:any) => p.value === bestScore).map((p:any) => p.measurement);

            /* -------------------------------
           이메일 기본 문구
            -------------------------------- */

            const emailTitle = this.recommendation.translation('results_skin_diagnosis_title', language);
            const emailMessage = this.recommendation.translation('results_skin_diagnosis_msg', language);
            const emailSubject = this.recommendation.translation('results_skin_diagnosis_title', language);

            /* -------------------------------
           제품 분류
            -------------------------------- */

            const skincareProducts_: any[] = [];
            const makeupProducts_: any[] = [];

            for (const product of productRec) {
                if (product.routine?.toLowerCase() === 'makeup') {
                    makeupProducts_.push(product);
                } else {
                    skincareProducts_.push(product);
                }
            }

            /* -------------------------------
           약점 TOP 5 (기존 구조 유지)
            -------------------------------- */

            const weakness1 = productOrder[0].measurement;
            const weaknesScore1 = productOrder[0].value;
            const weakness2 = productOrder[1].measurement;
            const weaknesScore2 = productOrder[1].value;
            const weakness3 = productOrder[2].measurement;
            const weaknesScore3 = productOrder[2].value;
            const weakness4 = productOrder[3].measurement;
            const weaknesScore4 = productOrder[3].value;
            const weakness5 = productOrder[4].measurement;
            const weaknesScore5 = productOrder[4].value;

            /* -------------------------------
           제품 2개씩 그룹핑
            -------------------------------- */

            const groupSize = 2;
            const skincareProducts = [];
            const makeupProducts = [];

            for (let i = 0; i < skincareProducts_.length; i += groupSize) {
                const group = skincareProducts_.slice(i, i + groupSize);
                const formattedGroup: any = {};

                group.forEach((p, idx) => {
                    formattedGroup[`product${idx + 1}`] = p;
                });

                skincareProducts.push(formattedGroup);
            }

            for (let i = 0; i < makeupProducts_.length; i += groupSize) {
                const group = makeupProducts_.slice(i, i + groupSize);
                const formattedGroup: any = {};

                group.forEach((p, idx) => {
                    formattedGroup[`product${idx + 1}`] = p;
                });

                makeupProducts.push(formattedGroup);
            }

            /* -------------------------------
           템플릿에 넘길 데이터
            -------------------------------- */

            const dynamicData = {
                emailTitle,
                emailMessage,

                weakness1,
                weaknesScore1,
                weakness2,
                weaknesScore2,
                weakness3,
                weaknesScore3,
                weakness4,
                weaknesScore4,
                weakness5,
                weaknesScore5,

                strengthMeasurements, // 핵심 추가

                skincareProducts,
                makeupProducts,
            };

            await this.email.sendEmailTemplate(
                body.email,
                String(emailSubject),
                'product_recommendation_updated',
                dynamicData,
            );

            return res.status(200).json({
                status: 200,
                service: 'Product Recommendation Email',
                message: 'Success',
            });
        } catch (e) {
            this.logger.error(`[getProductByEmail] ${e instanceof Error ? e.message : e}`);
            return res.status(500).json({
                status: 500,
                message: 'Internal server error',
            });
        }
    }

    @ApiExcludeEndpoint()
    @Get()
    async getCustomerAnalysis(@Param('customer_id') customer_id: number, @Res() res: Response) {
        try {
            const result = {};
            return res.status(200).json({
                status: 200,
                service: 'getCustomerAnalysis',
                ...result,
            });
        } catch (e) {
            this.logger.error(`[getCustomerAnalysis] ${e instanceof Error ? e.message : e}`);
            throw new InternalServerErrorException(
                e instanceof Error ? e.message : 'Failed to get customer analysis.',
            );
        }
    }
}
