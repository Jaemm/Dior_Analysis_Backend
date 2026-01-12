import { IsObject, IsOptional, IsString } from 'class-validator';

export class TimestampDto {
  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsString()
  onoff_mode?: string;

  @IsOptional()
  @IsString()
  consultant_id?: string;
  
  @IsOptional()
  @IsString()
  consultant_company_id?: string;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  optic_number?: string;

  @IsOptional()
  @IsString()
  app_id?: string;

  @IsOptional()
  @IsString()
  batch_id?: string;

  @IsOptional()
  @IsObject()
  crm?: {
    event_start: string;
    event_finish: string;
  };

  @IsOptional()
  @IsObject()
  questionnaire?: {
    event_start: string;
    event_finish: string;
  };

  @IsOptional()
  @IsObject()
  capture?: {
    event_start: string;
    event_finish: string;
  };

  @IsOptional()
  @IsObject()
  analysis?: {
    event_start: string;
    event_finish: string;
  };

  @IsOptional()
  @IsObject()
  result?: {
    event_start: string;
    event_finish: string;
  };
}
