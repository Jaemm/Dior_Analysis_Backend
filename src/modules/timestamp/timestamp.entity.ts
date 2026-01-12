import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

type TimestampEventData = {
  event_start: string;
  event_finish: string;
  duration?: string;
};

@Entity({ name: 'offline_timestamp' })
export class Timestamp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  mode: string;

  @Column({ type: 'varchar', nullable: true })
  onoff_mode: string;

  @Column({ type: 'int4', nullable: true })
  consultant_id: number;

  @Column({ type: 'int4', nullable: true })
  consultant_company_id: number;

  @Column({ type: 'int4', nullable: true })
  customer_id: number;

  @Column({ type: 'varchar', nullable: true })
  optic_number: string;

  @Column({ type: 'int4', nullable: true })
  app_id: number;

  @Column({ type: 'int4', nullable: true })
  batch_id: number;

  @Column({ type: 'jsonb', nullable: true })
  crm: TimestampEventData;

  @Column({ type: 'jsonb', nullable: true })
  questionnaire: TimestampEventData;

  @Column({ type: 'jsonb', nullable: true })
  capture: TimestampEventData;

  @Column({ type: 'jsonb', nullable: true })
  analysis: TimestampEventData;

  @Column({ type: 'jsonb', nullable: true })
  result: TimestampEventData;
}
