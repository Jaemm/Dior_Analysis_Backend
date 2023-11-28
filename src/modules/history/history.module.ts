import { Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { DatabaseService } from 'src/database/database.service';
import { DatabaseModule } from 'src/database/database.module';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

@Module({
    imports: [DatabaseModule],
    controllers: [HistoryController],
    providers: [HistoryService, FileUploadService, ConfigService],
})
export class HistoryModule {}

