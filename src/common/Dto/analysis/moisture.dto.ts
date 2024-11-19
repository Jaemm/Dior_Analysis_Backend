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
import { IsNumber, Min, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class MoistureDTO {
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
        example: 'density',
    })
    @IsString()
    type?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
        example: '29',
    })
    skinAge?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
        example: 'Mild',
    })
    skinCondition?: string | null;

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

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
        example: 20,
    })
    questionnaire_score?: number | null;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
        example: 200,
    })
    computation_score?: number | null;

    // @ApiProperty({ type: [ArgsDTO] })
    // args: ArgsDTO[];

    @IsOptional()
    // @IsString()
    task: any;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 200,
    })
    @IsOptional()
    raw: any;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 200,
    })
    @IsOptional()
    score: any;
}

// save flag

export class SaveFlagDto {
    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 5462,
    })
    @IsNotEmpty()
    batch_id: number | string;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'true',
    })
    @IsNotEmpty()
    status: any;
}
