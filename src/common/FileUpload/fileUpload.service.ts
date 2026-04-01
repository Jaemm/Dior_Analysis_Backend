import { ConsoleLogger, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { GetObjectCommand, GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
let COS = require('cos-nodejs-sdk-v5');
import { Upload } from '@aws-sdk/lib-storage';
import { NotFoundException } from '@nestjs/common/exceptions';

@Injectable()
export class FileUploadService {
    private readonly logger = new ConsoleLogger(FileUploadService.name);
    private readonly s3Client: S3Client;

    constructor(
        private readonly configService: ConfigService, // private readonly logger = new Logger(FileUploadService.name),
    ) {
        this.s3Client = new S3Client({
            region: this.configService.get('AWS_REGION'),
        });
    }

    async uploadFileToS3(file: Buffer, fileName: string) {
        try {
            const upload = new Upload({
                client: this.s3Client,
                params: {
                    Bucket: this.configService.get('AWS_BUCKET_NAME'),
                    Key: this.configService.get('AWS_PATH') + `${fileName}.jpg`,
                    Body: file,
                },
            });

            return await upload.done();
        } catch (err) {
            this.logger.error(`[uploadFileToS3] ${err instanceof Error ? err.message : err}`);
            throw err;
        }
    }
    async uploadImage(fileContent: Buffer, fileName: string) {
        if (this.configService.get('REGION') === 'CHINA') {
            return await this.uploadImageTencent(fileContent, fileName);
        }

        try {
            const upload = new Upload({
                client: this.s3Client,
                params: {
                    Bucket: this.configService.get('AWS_BUCKET_NAME'),
                    Key: this.configService.get('AWS_PATH') + `${fileName}.jpg`,
                    Body: fileContent,
                },
            });

            return await upload.done();
        } catch (err) {
            this.logger.error(`[uploadImage] ${err instanceof Error ? err.message : err}`);
            throw err;
        }
    }

    async getImageCloudS3(key: string): Promise<GetObjectCommandOutput> {
        if (this.configService.get('REGION') === 'CHINA') {
            return await this.getImageTencent(key);
        }

        return this.s3Client.send(
            new GetObjectCommand({
                Bucket: this.configService.get('AWS_BUCKET_NAME'),
                Key: this.configService.get('AWS_PATH') + key,
            }),
        );
    }

    getImageArgs(fileUsage: string | null = null, route: string, analysisType: string | null = null) {
        const hash = uuid();
        const imageRoute = 'image' + '/';
        let host: any = '';
        if (this.configService.get('SSL') === true) {
            host = this.configService.get('URL') + ':' + this.configService.get('PORT') + '/';
        } else {
            host = this.configService.get('URL') + ':' + this.configService.get('PORT') + '/';
        }
        const url = host + imageRoute + hash;
        const filename = `${hash}_${fileUsage}.jpg`;
        const prefix =
            typeof analysisType === 'string' && analysisType.trim().length > 0
                ? analysisType.trim()
                : typeof route === 'string' && route.trim().length > 0
                  ? route.trim()
                  : 'analysis';
        const sys_url = `${prefix}_${fileUsage}_${hash}`;

        return { hash, url, filename, sys_url };
    }

    getMaskArgs(fileUsage: string | null = null, route: string) {
        const hash = uuid();
        let host: any = '';
        if (this.configService.get('SSL') === true) {
            host = this.configService.get('URL') + ':' + this.configService.get('PORT');
        } else {
            host = this.configService.get('URL') + ':' + this.configService.get('PORT');
        }
        const url = 'https://' + host + route + hash;
        const filename = `${hash}_${fileUsage}.jpg`;
        const sys_url = `${fileUsage}_${hash}`;

        return { hash, url, filename, sys_url };
    }

    async getImagesFromCloud(sysUrl: string): Promise<GetObjectCommandOutput['Body']> {
        try {
            // const sysUrl = await this.getImage(hash);
            if (!sysUrl) throw new NotFoundException('product image was not found');
            const image = await this.getImageCloudS3(`${sysUrl}.jpg`);

            return image.Body;
        } catch (e) {
            this.logger.error(`[getImagesFromCloud] ${e instanceof Error ? e.message : e}`);
            throw e instanceof NotFoundException
                ? e
                : new InternalServerErrorException('Failed to load image from cloud storage.');
        }
    }

    async uploadImageTencent(fileContent: Buffer, filename: string) {
        const cos = new COS({
            SecretId: this.configService.get('TENCENT_SECRET_ID'),
            SecretKey: this.configService.get('TENCENT_SECRET_KEY'),
        });
        return new Promise((resolve, reject) => {
            cos.putObject(
                {
                    Bucket: this.configService.get('TENCENT_CFA_BUCKET_NAME'),
                    Region: this.configService.get('TENCENT_REGION'),
                    Key: filename + '.jpg',
                    StorageClass: 'STANDARD',
                    Body: fileContent,
                },
                function (err: any, data: any) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(data);
                },
            );
        });
    }

    async getImageTencent(key: string): Promise<any> {
        const cos = new COS({
            SecretId: this.configService.get('TENCENT_SECRET_ID'),
            SecretKey: this.configService.get('TENCENT_SECRET_KEY'),
        });
        return new Promise((resolve, reject) => {
            cos.getObject(
                {
                    Bucket: this.configService.get('TENCENT_CFA_BUCKET_NAME'),
                    Region: this.configService.get('TENCENT_REGION'),
                    Key: key,
                },
                (err: any, data: any) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(data);
                },
            );
        });
    }
}
