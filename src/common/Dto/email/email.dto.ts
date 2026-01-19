import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductRecommendationEmailDto {
    @ApiProperty({
        type: String,
        example: 'choicetech@test.com',
    })
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        type: Number,
        example: 1,
    })
    @IsNotEmpty()
    batchId: number;
}

