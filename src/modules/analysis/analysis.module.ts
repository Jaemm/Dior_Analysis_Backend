import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { DatabaseModule } from 'src/database/database.module';
import { AlgoAnalysisController } from './algoAnalysis/algoAnalysis.controller';
import { AlgoAnalysisService } from './algoAnalysis/algoAnalysis.service';
import { KeratinService } from '../algorithms/keratin/keratin.service';
import { BatchAnalysisService } from './batchAnalysis/batchAnalysis.service';
import { PoresService } from '../algorithms/pores/pores.service';
import { PorphyrinService } from '../algorithms/porphyrin/porphyrin.service';
import { SebumService } from '../algorithms/sebum/sebum.service';
import { SebumTService } from '../algorithms/sebumT/sebumT.service';
import { ShineService } from '../algorithms/shine/shine.service';
import { SpotsService } from '../algorithms/spots/spots.service';
import { SkintoneService } from '../algorithms/skinTone/skinTone.service';
import { SkinToneDiorService } from '../algorithms/skinToneDior/skinToneDior.service';
import { WrinklesService } from '../algorithms/wrinkles/wrinkles.service';
import { SensitivityScabsService } from '../algorithms/sensitivityScabs/sensitivityScabs.service';
import { SensitivityRednessService } from '../algorithms/sensitivityRedness/sensitivityRedness.service';
import { SensitivtyScalingService } from '../algorithms/sensitivtyScaling/sensitivtyScaling.service';
import { FitzSGService } from '../algorithms/fitzSG/fitzSG.service';
import { BullModule } from '@nestjs/bull';
import { MoistureUService } from '../algorithms/moistureU/moistureU.service';
import { MoistureTService } from '../algorithms/moistureT/moistureT.service';
import { SebumUService } from '../algorithms/sebumU/sebumU.service';
import { AuthMiddleware } from 'src/common/middleWare/authMiddlware/auth.middleware';
import { WebResultController } from './webResult/webResult.controller';
import { WebResultService } from './webResult/webResult.service';
import { ComputationService } from '../algorithms/computation/computation.service';
import { QuestionsService } from './questions/questions.service';
import { QuestionsController } from './questions/questions.controller';

@Module({
    imports: [
        DatabaseModule,
        BullModule.registerQueue({
            name: 'dataSaving',
        }),
    ],
    controllers: [AlgoAnalysisController, WebResultController, QuestionsController],
    providers: [
        ConfigService,
        FileUploadService,
        AlgoAnalysisService,
        KeratinService,
        BatchAnalysisService,
        PoresService,
        PorphyrinService,
        SebumService,
        SebumTService,
        ShineService,
        SpotsService,
        SkintoneService,
        SkinToneDiorService,
        WrinklesService,
        SensitivityScabsService,
        SensitivityRednessService,
        SensitivtyScalingService,
        FitzSGService,
        MoistureUService,
        MoistureTService,
        SebumUService,
        WebResultService,
        ComputationService,
        QuestionsService,
        // UploadProcessor,
    ],
})
export class AnalysisModule {
    // Auth Middleware
    // configure(consumer: MiddlewareConsumer) {
    //     consumer
    //         .apply(AuthMiddleware)
    //         // .exclude({ path: 'analysis', method: RequestMethod.POST })
    //         .forRoutes('analysis');
    // }
}

