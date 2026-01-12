import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timestamp } from './timestamp.entity';
import { TimestampService } from './timestamp.service';
import { TimestampController } from './timestamp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Timestamp])],
  providers: [TimestampService],
  controllers: [TimestampController],
  exports: [TypeOrmModule],
})
export class TimestampModule {}
