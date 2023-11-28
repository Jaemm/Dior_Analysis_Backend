import { Module } from '@nestjs/common';
import { AnanalysisHistoryController } from './customerHistory/customerHistory.controller';
import { AnanalysisHistoryService } from './customerHistory/customerHistory.service';

import { DatabaseModule } from 'src/database/database.module';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { ConfigService } from 'aws-sdk';
import { BullModule } from '@nestjs/bull';

@Module({
    imports: [DatabaseModule],
    controllers: [AnanalysisHistoryController],
    providers: [AnanalysisHistoryService, FileUploadService, ConfigService],
})
export class CustomerModule {}

