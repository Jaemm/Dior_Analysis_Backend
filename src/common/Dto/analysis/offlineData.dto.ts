import {
    IsNumber,
    Min,
    IsOptional,
    IsString,
    IsNotEmpty,
    IsArray,
    IsInt,
    IsObject,
    ValidateNested,
    ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { isNull } from 'util';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MultiArgsDTO {
    @ApiProperty({
        description: 'array of Scores',
        type: [Number],
        example: [1, 23],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    score?: number[];

    @ApiProperty({
        description: 'array of raw Scores',
        type: [Number],
        example: [1, 23],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    raw?: number[];
}

export class ArgsDTO {
    @ApiProperty({
        type: Number,
    })
    score?: number | string;

    @ApiProperty({
        type: Number,
    })
    raw?: number | string;
}

export class AlgoDTO {
    @ApiProperty({
        type: String,
        description: 'This is required',
    })
    algoName?: string;
}

export class OfflineDataCBBDTO {
    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    originalImage: string[];

    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    analyzedImage: string[];

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 5462,
    })
    @IsNotEmpty()
    batchId?: number;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
    })
    answers?: string | null;

    // @ApiProperty({
    //     type: String,
    //     description: 'This is required',
    //     example: 5462,
    // })
    // @IsNotEmpty()
    // birthYear?: number;

    @ApiProperty({
        type: Number,
        description: 'This is required',
        example: 1,
    })
    @IsNumber()
    algorithmId?: any | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Samsung',
    })
    deviceModel?: string | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Android',
    })
    deviceOS?: String | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'V_0.0.1',
    })
    appVersion?: String | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 45,
    })
    lat?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    long?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    temperature?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    humidity?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    uv_index?: number | null;

    @IsOptional()
    task?: AlgoDTO;

    @ApiProperty({ description: 'Nested object containing score and raw data', type: MultiArgsDTO })
    @IsObject()
    @ValidateNested()
    @Type(() => MultiArgsDTO)
    args: MultiArgsDTO | any;

    @IsOptional()
    batch_id: number;

    @IsOptional()
    consultant_id: any;

    @IsOptional()
    email: any;

    @IsOptional()
    app_id: any;

    @IsOptional()
    name: any;

    @IsOptional()
    score_average: any;
}

export class SkinToneDTO {
    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    image1: string[];

    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    image2: string[];

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 5462,
    })
    @IsNotEmpty()
    batch_id?: number;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Samsung',
    })
    deviceModel?: string | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Android',
    })
    deviceOS?: String | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 45,
    })
    lat?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    long?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    temperature?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    humidity?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    uv_index?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 1,
    })
    positionNumber: number;
}

export class SkinToneUploadDTO {
    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    image1: string[];

    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    image2: string[];

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 5462,
    })
    @IsNotEmpty()
    batchId?: number;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Samsung',
    })
    deviceModel?: string | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Android',
    })
    deviceOS?: String | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 45,
    })
    lat?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    long?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    temperature?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    humidity?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    uv_index?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: '4.5N',
    })
    shade: string;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
        example: '105,95,85,103,130,135,39,54,107',
    })
    @IsOptional()
    raw1: string;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
        example: '105,90,78,99,132,137,30,67,106',
    })
    @IsOptional()
    raw2: string;

    @ApiPropertyOptional({
        type: String,
        description: 'Only for skin tone',
        example: '105',
    })
    @IsOptional()
    averageR: string;

    @ApiPropertyOptional({
        type: String,
        description: 'Only for skin tone',
        example: '92',
    })
    @IsOptional()
    averageG: string;

    @ApiPropertyOptional({
        type: String,
        description: 'Only for skin tone',
        example: '81',
    })
    @IsOptional()
    averageB: string;

    algorithmId: number;

    @ApiProperty({
        type: Boolean,
        description: 'Whether the device is NG device',
        example: false,
        default: false,
    })
    is_ngdevice: boolean = false;

    @IsOptional()
    optic_number: string;
}

