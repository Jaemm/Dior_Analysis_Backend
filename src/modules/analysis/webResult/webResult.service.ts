import { ConsoleLogger, Injectable } from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class WebResultService {
    private readonly logger = new ConsoleLogger(WebResultService.name);

    constructor(private database: DatabaseService) {}

    skinCondition(moistureT: number, moistureU: number, sebumT: number, sebumU: number) {
        let moisture = null;
        if (moistureT !== null || moistureU !== null) {
            moisture = (Number(moistureT) + Number(moistureU)) / 2;
        }
        let sebum = null;
        if (sebumT !== null || sebumU !== null) {
            sebum = (Number(sebumT) + Number(moistureU)) / 2;
        }
        this.logger.debug(`[skinCondition] moisture=${moisture} sebum=${sebum}`);
        return {
            moisture: moisture,
            sebum: sebum,
        };
    }

    async webResult(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            WITH _results AS (
                SELECT DISTINCT
                    type_measurements."name" AS measurement,
                    to_json(original_img.scores) ->> 'score' as value,
                    (record.created_time AT TIME ZONE 'UTC') as date,
                    (record.created_time AT TIME ZONE 'UTC') as time,
                    original_img.url AS original_image_url,
                    analyzed_img.url AS analyzed_image_url,
                    ROW_NUMBER() OVER (PARTITION BY type_measurements."name") AS ROW_NUMBER
                FROM
                    analysis record
                    LEFT JOIN measurements as original_img ON record.batch_id = original_img.batch_id  AND original_img.type_image_id = 21 
                    LEFT JOIN type_measurements ON type_measurements.ID = original_img.type_measurement_id 
                    LEFT JOIN measurements as analyzed_img ON record.batch_id = analyzed_img.batch_id AND analyzed_img.type_image_id = 18
                        AND (original_img.args ->> 'nth_analysis' = analyzed_img.args ->> 'nth_analysis' OR type_measurements."name" = 'moistureT' OR type_measurements."name" = 'moistureU') -- Add the join condition here                 
                WHERE
                    record.batch_id = $1 AND (analyzed_img.type_image_id = 18)  
                    GROUP by type_measurements."name", original_img.url, analyzed_img.url, original_img.scores, record.created_time, original_img.type_measurement_id
            )
            SELECT
                measurement,
                value,
                date,
                time,
                original_image_url,
                analyzed_image_url
            FROM
                _results 
            WHERE
                ROW_NUMBER = 1;
                
            `,
            [batch_id],
        );
        return result;
    }

    // Check

    async webResultAverage(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            SELECT 
                ROUND(AVG_SCORE, 2) AS avg,
                NAME AS measurement
            FROM (
                SELECT 
                    tp.NAME as Name,
                    tp."id" as id,
                    ROUND(AVG((to_json(scores)->>'score')::NUMERIC), 2) AS AVG_SCORE
                FROM measurements AS ms
                JOIN type_measurements AS tp ON tp."id" = ms.type_measurement_id 
                WHERE batch_id = $1 AND type_image_id = 21
                GROUP BY tp.NAME, tp."id"
            ) AS subquery;
            `,
            [batch_id],
        );
        return result;
    }

    async finaleWebResult(batch_id: any) {
        const result = await this.webResult(batch_id);

        const avg = await this.webResultAverage(batch_id);

        let moistureT = null;
        let moistureU = null;
        let sebumT = null;
        let sebumU = null;

        for (let i = 0; i < result.length; i++) {
            if (result[i]['measurement'] === 'moistureT' || result[i]['measurement'] === 'moistureU') {
                result[i]['analyzed_image_url'] = null;
                result[i]['original_image_url'] = null;
            }

            result[i].value = +result[i].value;
            for (let j = 0; j < avg.length; j++) {
                if (avg[j].measurement === 'moistureT') moistureT = avg[j].avg;
                if (avg[j].measurement === 'moistureU') moistureU = avg[j].avg;
                if (avg[j].measurement === 'sebumT') sebumT = avg[j].avg;
                if (avg[j].measurement === 'sebumU') sebumU = avg[j].avg;

                if (result[i]['measurement'] === avg[j].measurement) {
                    result[i]['avg_value'] = parseFloat(avg[j].avg);
                    // result[i]['computation_score'] = parseFloat(avg[i].computation_score);
                    // result[i]['keyword_value'] = avg[j]['keyword_value'];
                    // result[i]['keyword_id'] = parseFloat(avg[j].keyword_id);
                }
            }
        }

        let hydration = 0;
        result.forEach((element: any) => {
            const value = Math.floor(element.avg_value || element.value || 0);
            if (element.measurement === 'moistureT' || element.measurement === 'moistureU') {
                hydration += value;

                delete element?.moistureT;
                delete element?.moistureU;
            }
        });
        const dehydration = 99 - Math.floor(hydration / 2);

        result.push({
            measurement: 'hydration',
            value: dehydration,
            date: result[0]?.date || new Date().toISOString().substring(0, 10),
            time: result[0]?.time || new Date().toISOString().substring(11, 19),
            original_image_url: null,
            analyzed_image_url: null,
            avg_value: dehydration,
        });

        return result;
    }
}
