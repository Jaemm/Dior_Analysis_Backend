import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimestampDto } from './timestamp.dto';
import { Timestamp } from './timestamp.entity';

@Injectable()
export class TimestampService {
  constructor(
    @InjectRepository(Timestamp)
    private readonly timestampRepository: Repository<Timestamp>,
  ) {}

  private calculateDuration(start: string, end: string): string | null {
    try {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      if (isNaN(startTime) || isNaN(endTime)) return null;

      const totalSeconds = Math.floor((endTime - startTime) / 1000);
      const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, '0');
      const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    } catch {
      return null;
    }
  }

  private addDuration(field: any): any {
    if (field?.event_start && field?.event_finish) {
      const duration = this.calculateDuration(
        field.event_start,
        field.event_finish,
      );
      return { ...field, duration };
    }
    return field;
  }

  private toStringResponse(entity: Timestamp): any {
    const stringifyEventData = (data: any) => ({
      event_start: data?.event_start ?? '',
      event_finish: data?.event_finish ?? '',
      duration: data?.duration ?? '',
    });

    return {
      id: entity.id.toString(),
      mode: entity.mode,
      onoff_mode: entity.onoff_mode,
      consultant_id: entity.consultant_id?.toString(),
      consultant_company_id: entity.consultant_company_id?.toString(),
      customer_id: entity.customer_id?.toString(),
      app_id: entity.app_id?.toString(),
      optic_number: entity.optic_number?.toString(),
      batch_id: entity.batch_id?.toString(),
      crm: stringifyEventData(entity.crm),
      questionnaire: stringifyEventData(entity.questionnaire),
      capture: stringifyEventData(entity.capture),
      analysis: stringifyEventData(entity.analysis),
      result: stringifyEventData(entity.result),
    };
  }

  async create(dto: TimestampDto) {
    const entity = this.timestampRepository.create({
      mode: dto.mode,
      onoff_mode: dto.onoff_mode,
      consultant_id: parseInt(dto.consultant_id, 10) || null,
      consultant_company_id: parseInt(dto.consultant_company_id, 10) || null,
      customer_id: parseInt(dto.customer_id, 10) || null,
      app_id: parseInt(dto.app_id, 10) || null,
      optic_number: dto.optic_number || null,
      batch_id: parseInt(dto.batch_id, 10) || null,
      crm: this.addDuration(dto.crm),
      questionnaire: this.addDuration(dto.questionnaire),
      capture: this.addDuration(dto.capture),
      analysis: this.addDuration(dto.analysis),
      result: this.addDuration(dto.result),
    });

    const saved = await this.timestampRepository.save(entity);

    return this.toStringResponse(saved);
  }

  async findAll() {
    const list = await this.timestampRepository.find({
      order: { id: 'DESC' },
    });
    return list.map((item) => this.toStringResponse(item));
  }

  async findOne(id: number) {
    const entity = await this.timestampRepository.findOneBy({ id });
    return entity ? this.toStringResponse(entity) : null;
  }
}
