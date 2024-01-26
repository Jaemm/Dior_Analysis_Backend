import {
    Controller,
    Body,
    Get,
    Post,
    UseInterceptors,
    UploadedFiles,
    Res,
    Param,
    Query,
    Headers,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProductRecommendationService } from './productRecommendation.service';
import { ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, response, Response } from 'express';
import { EmailService } from '../email/email.service';
import { ProductRecommendationEmailDto } from 'src/common/Dto/email/email.dto';

@Controller('productRecommendation')
@ApiTags('Product Recommendation')
export class ProductRecommendationController {
    constructor(private readonly recommendation: ProductRecommendationService, private readonly email: EmailService) {}

    // @ApiExcludeEndpoint()
    @Post('')
    async getProductByEmail(
        @Body() body: ProductRecommendationEmailDto,
        @Headers('x-chowis-locale') chowisLocale: string,
        @Res() res: Response,
    ) {
        try {
            const productOrder = await this.recommendation.scoresSorting(body.batchId, chowisLocale);

            const productRec = await this.recommendation.getRecommendedProduct(body.batchId, chowisLocale);

            if (productOrder.length === 0 || productRec.length === 0) {
                return res.status(400).json({
                    status: 400,
                    service: 'getBatchId',
                    Meassage: 'Result not found, email not send',
                });
            }

            const skincareProducts: any[] = [];
            const makeupProducts: any[] = [];

            for (let i = 0; i < productRec.length; i++) {
                if (productRec[i]['routine'] === 'Makeup') {
                    makeupProducts.push(productRec[i]);
                }
                skincareProducts.push(productRec[i]);
            }

            const emailFile = 'product_recommendation';

            const weakness1 = productOrder[0]['measurement'];
            const weaknesScore1 = productOrder[0]['value'];
            const weakness2 = productOrder[1]['measurement'];
            const weaknesScore2 = productOrder[1]['value'];
            const weakness3 = productOrder[2]['measurement'];
            const weaknesScore3 = productOrder[2]['value'];
            const weakness4 = productOrder[3]['measurement'];
            const weaknesScore4 = productOrder[3]['value'];
            const weakness5 = productOrder[4]['measurement'];
            const weaknesScore5 = productOrder[4]['value'];

            const dynamicData = {
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
                makeupProducts,
                skincareProducts,
            };

            return this.email
                .sendEmailTemplate(body.email, 'Your Dior Skin Analyzer Consultation Result', emailFile, dynamicData)
                .then(() =>
                    res.status(200).json({
                        status: 200,
                        service: 'Product Recommendation Email',
                        message: 'Success',
                    }),
                );
        } catch (e) {
            throw new Error(e);
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
            throw new Error(e);
        }
    }
}

