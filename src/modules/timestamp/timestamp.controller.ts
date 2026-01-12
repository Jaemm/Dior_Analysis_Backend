import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { TimestampDto } from './timestamp.dto';
import { TimestampService } from './timestamp.service';

@Controller('/timestamp')
export class TimestampController {
  constructor(private readonly service: TimestampService) {}

  @Post()
  async create(@Body() dto: TimestampDto) {
    const saved = await this.service.create(dto);
    return {
      success: true,
      message: '데이터 저장 성공',
      data: saved,
    };
  }

  @Get()
  async list() {
    return { success: true, data: await this.service.findAll() };
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return { success: true, data: await this.service.findOne(id) };
  }
}
