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
    args: MultiArgsDTO;
}

