import { Controller, Body, Get, Post, UseInterceptors, UploadedFiles, Res, Param } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, response, Response } from 'express';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';

@Controller('image')
export class ImagesController {
    constructor(private readonly ImagesService: ImagesService, private readonly fileUpload: FileUploadService) {}

    @ApiExcludeEndpoint()
    @Get('/:hash')
    async getOriginalImage(@Param('hash') hash: string, @Res() res: Response) {
        const sysUrl = await this.ImagesService.getImage(hash);

        const image = await this.fileUpload.getImagesFromCloud(sysUrl[0]['sys_url']);

        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.write(image, 'binary');
        res.end(null, 'binary');
        return res.status(200);
    }
}

