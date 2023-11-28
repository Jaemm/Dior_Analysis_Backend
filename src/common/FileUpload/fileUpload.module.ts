import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileUploadService } from './fileUpload.service';
import { BullModule } from '@nestjs/bull';

@Module({
    imports: [],
    providers: [FileUploadService, ConfigService],
})
export class FileUploaddModule {}

