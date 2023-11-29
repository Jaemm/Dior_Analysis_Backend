import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { S3 } from "@aws-sdk/client-s3";
import { v4 as uuid } from 'uuid';
import { GetObjectOutput, ManagedUpload } from 'aws-sdk/clients/s3';
import { S3Client, GetObjectCommand, CopyObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { S3 } from 'aws-sdk';
// import COS from 'cos-nodejs-sdk-v5';
let COS = require('cos-nodejs-sdk-v5');
import { Upload } from '@aws-sdk/lib-storage';
import * as path from 'path';
import { NotFoundException } from '@nestjs/common/exceptions';

@Injectable()
export class FileUploadService {
    constructor(
        private readonly configService: ConfigService, // private readonly logger = new Logger(FileUploadService.name),
    ) {}

    async uploadFileToS3(file: Buffer, fileName: string) {
        const s3 = new S3();
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: this.configService.get('AWS_BUCKET_NAME'),
                Key: this.configService.get('AWS_PATH') + `${fileName}.jpg`,
                Body: file,
            };

            s3.upload(params, (err: any, data: any) => {
                if (err) {
                    console.error(`Error uploading file to S3: ${err.message}`);
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
    async uploadImage(fileContent: Buffer, fileName: string) {
        if (this.configService.get('REGION') === 'CHINA') {
            return await this.uploadImageTencent(fileContent, fileName);
        }

        const s3 = new S3({ region: this.configService.get('AWS_REGION') });
        const params = {
            Bucket: this.configService.get('AWS_BUCKET_NAME'),
            Key: this.configService.get('AWS_PATH') + `${fileName}.jpg`,
            Body: fileContent,
        };

        return new Promise((resolve, reject) => {
            s3.upload(params, (err: unknown, data: ManagedUpload.SendData) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
        // return true;
        // } catch (e) {
        //     console.log(e);
        // }
    }

    async getImageCloudS3(key: string): Promise<GetObjectOutput> {
        if (this.configService.get('REGION') === 'CHINA') {
            return await this.getImageTencent(key);
        }
        const params = {
            Bucket: this.configService.get('AWS_BUCKET_NAME'),
            Key: this.configService.get('AWS_PATH') + key,
        };
        const s3 = new S3();
        return new Promise((resolve, reject) => {
            s3.getObject(params, function (err, data) {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    }

    getImageArgs(fileUsage: string | null = null, route: string, analysisType: string | null = null) {
        const hash = uuid();
        route = 'image' + '/';
        let host: any = '';
        if (this.configService.get('SSL') === true) {
            host = this.configService.get('URL') + ':' + this.configService.get('PORT') + '/';
        } else {
            host = this.configService.get('URL') + ':' + this.configService.get('PORT') + '/';
        }
        const url = host + route + hash;
        const filename = `${hash}_${fileUsage}.jpg`;
        const sys_url = `${analysisType}_${fileUsage}_${hash}`;

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

    async getImagesFromCloud(sysUrl: string) {
        try {
            // const sysUrl = await this.getImage(hash);
            if (!sysUrl) throw new NotFoundException('product image was not found');
            const image = await this.getImageCloudS3(`${sysUrl}.jpg`);

            return image.Body;
        } catch (e) {
            console.log(e);
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

