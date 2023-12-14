import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuestionDTO {
    @ApiProperty({
        type: Number,
        example: 1,
    })
    @IsNotEmpty()
    batch_id?: number | string;

    @ApiProperty({
        type: String,
        example: 'ABCDEFG',
    })
    @IsString()
    answers?: string;

    args: any;
}

