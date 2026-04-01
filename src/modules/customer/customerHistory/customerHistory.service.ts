import { ConsoleLogger, Injectable, InternalServerErrorException } from '@nestjs/common';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AnanalysisHistoryService {
    private readonly logger = new ConsoleLogger(AnanalysisHistoryService.name);

    constructor(private database: DatabaseService) {}

    async GetcustomerHistory(customer_id: number, data: GetcustomerHistoryDTO) {
        try {
            let mainSQL = `SELECT
                        batch_id,
                        created_time,
                        to_json ( args ) ->> 'lat' AS lat,
                        to_json ( args ) ->> 'long' AS long,
                        to_json ( args ) ->> 'deviceOS' AS deviceOS,
                        to_json ( args ) ->> 'deviceModel' AS deviceModel 
                    FROM
                        analysis 
                    `;
            let resp: any;
            let totalPages: any;
            let dateFilterSql: any;
            if (data.page && data.limit && !data.search && !data.from && !data.to) {
                dateFilterSql = ` WHERE customer_id = ${Number(customer_id)}
        LIMIT ${Number(data.limit)} OFFSET ${Number((data.page - 1) * data.limit)};`;
                resp = await this.database.executeQuery(mainSQL + dateFilterSql);
            } else if (data.to && data.from && !data.search) {
                dateFilterSql = ` WHERE customer_id = ${Number(customer_id)} AND
        created_time >= timestamp '${data.from}'
        AND created_time <= timestamp '${data.to}'
        LIMIT ${Number(data.limit)} OFFSET ${Number((data.page - 1) * data.limit)};`;
                resp = await this.database.executeQuery(mainSQL + dateFilterSql);
            } else if (data.to && !data.from && !data.search) {
                dateFilterSql = ` WHERE customer_id = ${Number(customer_id)} AND
        created_time <= timestamp '${data.to}'
        LIMIT ${Number(data.limit)} OFFSET ${Number((data.page - 1) * data.limit)};`;
                resp = await this.database.executeQuery(mainSQL + dateFilterSql);
            } else if (!data.to && data.from && !data.search) {
                dateFilterSql = ` WHERE customer_id = ${Number(customer_id)} AND
        created_time >= timestamp '${data.from}'
        LIMIT ${Number(data.limit)} OFFSET ${Number((data.page - 1) * data.limit)};`;
                resp = await this.database.executeQuery(mainSQL + dateFilterSql);
            } else if (data.search) {
                dateFilterSql = ` WHERE customer_id = ${Number(customer_id)}
        AND CAST(batch_id as TEXT) LIKE '${data.search}%'`;
                resp = await this.database.executeQuery(mainSQL + dateFilterSql);
            } else {
                resp = await this.database.executeQuery(mainSQL + ` WHERE customer_id = ${Number(customer_id)}`);
            }

            const result: any = await this.database.executeQuery(
                `
        select count(*)
        from analysis
        where customer_id = $1 -- customer_id
  `,
                [Number(customer_id)],
            );
            totalPages = Math.ceil(Number(result?.[0]?.count) / Number(data.limit));

            const retObj = {
                status: 200,
                service: 'Customer Analysis History',
                count: result[0].count,
                totalPages: totalPages,
                currentPage: data.page,
                data: resp,
            };
            return retObj;
        } catch (error) {
            this.logger.error(`[GetcustomerHistory] ${error instanceof Error ? error.message : error}`);
            throw new InternalServerErrorException('Failed to fetch customer analysis history.');
        }
    }

    async getcustomerHistoryDetail(data: GetcustomerHistoryDTO) {
        const rows = await this.database.executeQuery(
            `
      select batch_id,
        customer_id,
        created_time,
        'cndp skin' as type,
        args
      from analysis
      where batch_id = $1;
    `,
            [data.batch_id],
        );

        const resObj = {
            status: 200,
            service: 'Customer Analysis History Details',
            device_details: '',
            customer_details: rows,
        };

        return resObj;
    }

    async analysisInfor(batch_id: number) {
        const result = await this.database.executeQuery(
            `
                SELECT
                    type_measurements."name" AS measurement,
                    batch_id,
                    url as original_image,
                    hash,
                    type_images.NAME AS TYPE,
                    to_json ( scores ) AS args,
                    hash,
                    created_time 
                FROM
                    measurements record
                    LEFT JOIN type_images ON type_images.ID = record.type_image_id
                    LEFT JOIN type_measurements ON type_measurements.id = record.type_measurement_id 
                WHERE batch_id = $1 AND ( type_image_id = 21 );
            `,
            [batch_id],
        );
        return result;
    }
}
