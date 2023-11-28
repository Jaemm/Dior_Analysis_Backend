// batch_id
// type
// deviceModel
// deviceOS
// lat
// long
// temperature
// humidity
// uv_index
// positionNumber
import { IsNumber, Min, IsOptional, IsString, IsNotEmpty, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { isNull } from 'util';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AlgoAnalysisCBBDTO {
    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    image: string[];

    @ApiProperty({
        type: Number,
        description: 'This is requiredd',
    })
    batch_id?: number;

    @ApiProperty({
        type: String,
        description: 'This is required',
    })
    type?: string | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
    })
    deviceModel?: string | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
    })
    deviceOS?: String | null;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
    })
    answers?: string | null;

    @ApiProperty({
        type: Number,
        description: 'This is required',
    })
    lat?: number | null;

    @ApiProperty({
        type: Number,
        description: 'This is required',
    })
    long?: number | null;

    @ApiProperty({
        type: Number,
        description: 'This is required',
    })
    temperature?: number | null;

    @ApiProperty({
        type: Number,
        description: 'This is required',
    })
    humidity?: number | null;

    @ApiProperty({
        type: Number,
        description: 'This is required',
    })
    uv_index?: number | null;

    @ApiProperty({
        type: Number,
        description: 'This is required',
    })
    positionNumber?: number | null;

    @IsOptional()
    // @IsString()
    task: any;
}

export class historyDTO {
    @IsNotEmpty()
    @ApiProperty({
        type: String,
        description: 'This is required',
        example: '6',
    })
    customer_id: string | number;
}

export class paginationDTO {
    @IsOptional()
    @ApiPropertyOptional({
        type: String,
        description: 'This is not required',
        example: 10,
    })
    per: string | number;

    @IsOptional()
    @ApiPropertyOptional({
        type: String,
        description: 'This is not required',
        example: 1,
    })
    page: string | number;
}

export class BatchIdCheckerDto {
    @IsString()
    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 4810,
    })
    batch_id: string;
}

export class SkinAgeConditionDto {
    @IsNotEmpty()
    @ApiProperty({
        type: Number,
        description: 'This is required',
        example: 426496,
    })
    batch_id: any;

    @IsNotEmpty()
    @ApiProperty({
        type: Number,
        description: 'This is required',
        example: 2000,
    })
    bithYear: any;
}

export class AlgoAnalysisDTO {
    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    image: string[];
    @ApiProperty({
        type: Number,
        description: 'This is requiredd',
    })
    batch_id?: number;

    @IsOptional()
    @ApiPropertyOptional({
        type: String,
        description: 'This is an optional property',
    })
    type?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'This is an optional property',
    })
    @IsOptional()
    answers?: string | null;
    @ApiPropertyOptional({
        type: String,
        description: 'This is an optional property',
    })
    @IsOptional()
    // @Type(() => String)
    // @IsString()
    deviceModel?: string | null;
    @ApiPropertyOptional({
        type: String,
        description: 'This is an optional property',
    })
    @IsOptional()
    // @Type(() => String)
    // @IsString()
    deviceOS?: String | null;
    @ApiPropertyOptional({
        type: String,
        description: 'This is an optional property',
    })
    @IsOptional()
    // @Type(() => Number)
    // @IsNumber()
    lat?: number | null;
    @ApiPropertyOptional({
        type: String,
        description: 'This is an optional property',
    })
    @IsOptional()
    // @Type(() => Number)
    // @IsNumber()number | null
    long?: number | null;
    @ApiPropertyOptional({
        type: String,
        description: 'This is an optional property',
    })
    temperature?: number | null;
    @ApiPropertyOptional({
        type: String,
        description: 'This is an optional property',
    })
    @IsOptional()
    // @IsNumber()
    humidity?: number | null;
    @ApiPropertyOptional({
        type: String,
        description: 'This is an optional property',
    })
    @IsOptional()
    // @IsNumber()
    uv_index?: number | null;
    @ApiPropertyOptional({
        type: String,
        description: 'This is an optional property',
    })
    @IsOptional()
    // @IsNumber()
    positionNumber?: number | null;

    @IsOptional()
    // @IsString()
    task: any;
}

export class countCustomerDto {
    @IsArray()
    @IsInt({ each: true })
    @Min(0, { each: true })
    @ApiProperty({
        type: 'array',
        description: 'This is required',
        example: [0, 6],
    })
    customer_ids: number[];
}

export class allCustomerDto {
    @IsArray()
    @IsInt({ each: true })
    @Min(0, { each: true })
    @ApiProperty({
        type: 'array',
        description: 'This is required',
        example: [0, 6],
    })
    customer_ids: number[];

    @IsString()
    @ApiProperty({
        type: String,
        description: 'This is required',
        example: '2023-07',
    })
    month: string;
}

