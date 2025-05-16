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
            let language = chowisLocale ?? 'en';
            if (language.length > 4 || language.length < 1) language = 'en';

            console.log('language', language);
            const productOrder = await this.recommendation.scoresSorting(body.batchId, language);
            const productRec = await this.recommendation.getRecommendedProduct(body.batchId, language);

            console.log('productOrder', productOrder);

            console.log('productRec', productRec);

            if (productOrder.length === 0 || productRec.length === 0) {
                return res.status(400).json({
                    status: 400,
                    service: 'getBatchId',
                    Meassage: 'Result not found, email not send',
                });
            }

            const emailTitle = this.recommendation.translation('results_skin_diagnosis_title', language);
            const emailMessage = this.recommendation.translation('results_skin_diagnosis_msg', language);
            const emailSubject = this.recommendation.translation('results_skin_diagnosis_title', language);
            const skincareProducts_: any[] = [];
            const makeupProducts_: any[] = [];

            for (let i = 0; i < productRec.length; i++) {
                if (productRec[i]['routine'].toLowerCase() === 'makeup') {
                    makeupProducts_.push(productRec[i]);
                } else {
                    skincareProducts_.push(productRec[i]);
                }
            }

            const emailFile = 'product_recommendation_updated';
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

            const groupSize = 2;
            const skincareProducts = [];
            const makeupProducts = [];

            for (let i = 0; i < skincareProducts_.length; i += groupSize) {
                const group = skincareProducts_.slice(i, i + groupSize);
                const formattedGroup: any = {};

                for (let j = 0; j < group.length; j++) {
                    formattedGroup[`product${j + 1}`] = group[j];
                }

                skincareProducts.push(formattedGroup);
            }

            // In case of makup
            for (let i = 0; i < makeupProducts_.length; i += groupSize) {
                const group = makeupProducts_.slice(i, i + groupSize);
                const formattedGroup: any = {};

                for (let j = 0; j < group.length; j++) {
                    formattedGroup[`product${j + 1}`] = group[j];
                }

                makeupProducts.push(formattedGroup);
            }

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
                makeupProducts,
                skincareProducts,
            };

            return this.email.sendEmailTemplate(body.email, String(emailSubject), emailFile, dynamicData).then(() =>
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
// import {
//     Controller,
//     Body,
//     Post,
//     Res,
//     Headers,
//     HttpException,
//     HttpStatus
// } from '@nestjs/common';
// import { ProductRecommendationService } from './productRecommendation.service';
// import { ApiTags } from '@nestjs/swagger';
// import { Response } from 'express';
// import { EmailService } from '../email/email.service';
// import { ProductRecommendationEmailDto } from 'src/common/Dto/email/email.dto';

// @Controller('productRecommendation')
// @ApiTags('Product Recommendation')
// export class ProductRecommendationController {
//     constructor(
//         private readonly recommendation: ProductRecommendationService,
//         private readonly email: EmailService
//     ) {}

//     @Post('')
//     async getProductByEmail(
//         @Body() body: ProductRecommendationEmailDto,
//         @Headers('x-chowis-locale') chowisLocale: string,
//         @Res() res: Response,
//     ) {
//         try {
//             let language = chowisLocale ?? 'en';
//             if (language.length > 4 || language.length < 1) language = 'en';
    
//             console.log('[DEBUG] Fetching scoresSorting... batchId:', body.batchId, 'language:', language);
//             const productOrder = await this.recommendation.scoresSorting(body.batchId, language);
//             console.log('[DEBUG] Raw productOrder:', JSON.stringify(productOrder, null, 2));
    
//             if (!productOrder || !Array.isArray(productOrder) || productOrder.length === 0) {
//                 console.error('[ERROR] Empty or invalid productOrder:', productOrder);
//                 return res.status(400).json({
//                     status: 400,
//                     service: 'getBatchId',
//                     message: 'Result not found, email not sent',
//                 });
//             }
    
//             console.log('[DEBUG] Fetching getRecommendedProduct...');
//             const productRec = await this.recommendation.getRecommendedProduct(body.batchId, language);
//             console.log('[DEBUG] Raw productRec:', JSON.stringify(productRec, null, 2));
    
//             if (!productRec || !Array.isArray(productRec) || productRec.length === 0) {
//                 console.error('[ERROR] Empty or invalid productRec:', productRec);
//                 return res.status(400).json({
//                     status: 400,
//                     service: 'getBatchId',
//                     message: 'Result not found, email not sent',
//                 });
//             }
    
//             // 🔍 productOrder 내부 데이터 확인
//             console.log('[DEBUG] Checking each item in productOrder before filtering:');
//             productOrder.forEach((item, index) => {
//                 console.log(`[DEBUG] item[${index}] =`, item);
//             });
    
//             // 🔍 필터링된 데이터 확인
//             const safeProductOrder = productOrder.filter(item => item && item.measurement !== undefined);
//             console.log('[DEBUG] Filtered safeProductOrder:', JSON.stringify(safeProductOrder, null, 2));
    
//             if (safeProductOrder.length < 5) {
//                 console.error('[ERROR] Insufficient measurement data:', safeProductOrder);
//                 return res.status(400).json({
//                     status: 400,
//                     service: 'getBatchId',
//                     message: `Insufficient measurement data. Found only ${safeProductOrder.length}`,
//                 });
//             }
    
//             // 🔍 특정 인덱스의 데이터가 정상적으로 들어오는지 확인
//             console.log('[DEBUG] Checking individual weaknesses:');
//             safeProductOrder.slice(0, 5).forEach((item, index) => {
//                 console.log(`[DEBUG] weakness${index + 1} =`, item);
//             });
    
//             const weakness1 = safeProductOrder[0].measurement;
//             const weaknessScore1 = safeProductOrder[0].value;
//             const weakness2 = safeProductOrder[1].measurement;
//             const weaknessScore2 = safeProductOrder[1].value;
//             const weakness3 = safeProductOrder[2].measurement;
//             const weaknessScore3 = safeProductOrder[2].value;
//             const weakness4 = safeProductOrder[3].measurement;
//             const weaknessScore4 = safeProductOrder[3].value;
//             const weakness5 = safeProductOrder[4].measurement;
//             const weaknessScore5 = safeProductOrder[4].value;
    
//             return res.status(200).json({
//                 status: 200,
//                 service: 'Product Recommendation',
//                 message: 'Success',
//             });
    
//         } catch (error) {
//             console.error('[ERROR] Error processing product recommendation:', error);
        
//             throw new HttpException(
//                 { status: 500, message: error.message || 'Internal Server Error' },
//                 HttpStatus.INTERNAL_SERVER_ERROR
//             );
//         }
//     }
    
    
// }
