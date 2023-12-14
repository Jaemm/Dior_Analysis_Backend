import { Module } from '@nestjs/common';
import { ProductRecommendationService } from './productRecommendation.service';
import { ProductRecommendationController } from './productRecommendation.controller';
import { DatabaseModule } from '../../database/database.module';

import { ConfigService } from '@nestjs/config';
import { WebResultService } from '../analysis/webResult/webResult.service';
import { EmailService } from '../email/email.service';

@Module({
    imports: [DatabaseModule],
    controllers: [ProductRecommendationController],
    providers: [ProductRecommendationService, WebResultService, ConfigService, EmailService],
})
export class ProductRecommendationModule {}

