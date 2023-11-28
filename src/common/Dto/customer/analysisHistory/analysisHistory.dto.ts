import { IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetcustomerHistoryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customer_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsString()
  from?: String;

  @IsOptional()
  @Type(() => Number)
  @IsString()
  to?: String;

  @IsOptional()
  @Type(() => Number)
  @IsString()
  search?: number;

  @IsOptional()
  @IsString()
  filter_by?: string;

  @IsOptional()
  batch_id?: number | string;
}
