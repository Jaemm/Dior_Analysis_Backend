import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { DatabaseModule } from 'src/database/database.module';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [DatabaseModule],
    controllers: [ImagesController],
    providers: [ImagesService, FileUploadService, ConfigService],
})
export class ImagesModule {
    // Auth Middleware
    // configure(consumer: MiddlewareConsumer) {
    //     consumer
    //         .apply(AuthMiddleware)
    //         .forRoutes('image');
    // }
}
