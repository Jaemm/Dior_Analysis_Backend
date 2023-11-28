import { Injectable, Inject, HttpException, ConsoleLogger, BadRequestException } from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class WebResultService {
    constructor(private database: DatabaseService) {}

    skinCondition(moistureT: number, moistureU: number, sebumT: number, sebumU: number) {
        console.log('chack data', moistureT, moistureU, sebumT, sebumU, sebumU);
        let moisture = null;
        if (moistureT !== null || moistureU !== null) {
            moisture = (Number(moistureT) + Number(moistureU)) / 2;
        }
        let sebum = null;
        if (sebumT !== null || sebumU !== null) {
            sebum = (Number(sebumT) + Number(moistureU)) / 2;
        }
        console.log('check', moisture, sebum);
        return {
            moisture: moisture,
            sebum: sebum,
        };
    }

    getSkinCondition(mScoreT: number, sScoreT: number, mScoreU: number, sScoreU: number, sebumQAScore: number) {
        const veryDry = 1;
        const dry = 2;
        const normal = 3;
        const oily = 4;
        const veryOily = 5;
        const combination = 6;

        let tZoneType = 0;
        let uZoneType = 0;
        let skinCondition = 0;

        console.log(sebumQAScore);

        if (sebumQAScore >= 0 && sScoreT >= 0) {
            sScoreT = Math.round(0.8 * sScoreT + 0.2 * sebumQAScore);
        }

        // Logic for determining skin condition
        // ...
        // Combine t-zone sebum score with sebum Q&A score.
        if (sebumQAScore >= 0 && sScoreT >= 0) sScoreT = Math.round(0.8 * sScoreT + 0.2 * sebumQAScore);

        // ---------- (1) ----------
        // When either one of the mositure scores is not available, we define skin/scalp condition with sebum scores.
        // -- This should only apply to CMA Hair, HH/CHP Hair where moisture measurement is not accurate.
        if (mScoreT == -1 || mScoreU == -1) {
            if (sScoreU >= 0 && sScoreU < 6) {
                if (sScoreT >= 0 && sScoreT < 6) skinCondition = veryDry;
                if (sScoreT >= 6 && sScoreT < 16) skinCondition = dry;
                if (sScoreT >= 16 && sScoreT < 49) skinCondition = dry;
                if (sScoreT >= 49 && sScoreT < 81) skinCondition = combination;
                if (sScoreT >= 81 && sScoreT <= 99) skinCondition = combination;
            }
            if (sScoreU >= 6 && sScoreU < 16) {
                if (sScoreT >= 0 && sScoreT < 6) skinCondition = dry;
                if (sScoreT >= 6 && sScoreT < 16) skinCondition = dry;
                if (sScoreT >= 16 && sScoreT < 49) skinCondition = dry;
                if (sScoreT >= 49 && sScoreT < 81) skinCondition = combination;
                if (sScoreT >= 81 && sScoreT <= 99) skinCondition = combination;
            }
            if (sScoreU >= 16 && sScoreU < 49) {
                if (sScoreT >= 0 && sScoreT < 6) skinCondition = dry;
                if (sScoreT >= 6 && sScoreT < 16) skinCondition = dry;
                if (sScoreT >= 16 && sScoreT < 49) skinCondition = normal;
                if (sScoreT >= 49 && sScoreT < 81) skinCondition = oily;
                if (sScoreT >= 81 && sScoreT <= 99) skinCondition = oily;
            }
            if (sScoreU >= 49 && sScoreU < 81) {
                if (sScoreT >= 0 && sScoreT < 6) skinCondition = combination;
                if (sScoreT >= 6 && sScoreT < 16) skinCondition = combination;
                if (sScoreT >= 16 && sScoreT < 49) skinCondition = oily;
                if (sScoreT >= 49 && sScoreT < 81) skinCondition = oily;
                if (sScoreT >= 81 && sScoreT <= 99) skinCondition = oily;
            }
            if (sScoreU >= 81 && sScoreU <= 99) {
                if (sScoreT >= 0 && sScoreT < 6) skinCondition = combination;
                if (sScoreT >= 6 && sScoreT < 16) skinCondition = combination;
                if (sScoreT >= 16 && sScoreT < 49) skinCondition = oily;
                if (sScoreT >= 49 && sScoreT < 81) skinCondition = oily;
                if (sScoreT >= 81 && sScoreT <= 99) skinCondition = veryOily;
            }
        }

        // ---------- (2) ---------
        // When both moisture scores and both sebum scores are available.
        // obtain T-zone skin/scalp type.
        if (mScoreT >= 0 && mScoreT < 6) {
            if (sScoreT >= 0 && sScoreT < 6) tZoneType = veryDry;
            if (sScoreT >= 6 && sScoreT < 16) tZoneType = dry;
            if (sScoreT >= 16 && sScoreT < 49) tZoneType = dry;
            if (sScoreT >= 49 && sScoreT < 81) tZoneType = oily;
            if (sScoreT >= 81 && sScoreT <= 99) tZoneType = veryOily;
        }
        if (mScoreT >= 6 && mScoreT < 16) {
            if (sScoreT >= 0 && sScoreT < 6) tZoneType = dry;
            if (sScoreT >= 6 && sScoreT < 16) tZoneType = dry;
            if (sScoreT >= 16 && sScoreT < 49) tZoneType = dry;
            if (sScoreT >= 49 && sScoreT < 81) tZoneType = oily;
            if (sScoreT >= 81 && sScoreT <= 99) tZoneType = veryOily;
        }
        if (mScoreT >= 16 && mScoreT < 49) {
            if (sScoreT >= 0 && sScoreT < 6) tZoneType = dry;
            if (sScoreT >= 6 && sScoreT < 16) tZoneType = normal;
            if (sScoreT >= 16 && sScoreT < 49) tZoneType = normal;
            if (sScoreT >= 49 && sScoreT < 81) tZoneType = oily; // Here
            if (sScoreT >= 81 && sScoreT <= 99) tZoneType = veryOily;
        }
        if (mScoreT >= 49 && mScoreT < 81) {
            if (sScoreT >= 0 && sScoreT < 6) tZoneType = normal;
            if (sScoreT >= 6 && sScoreT < 16) tZoneType = normal;
            if (sScoreT >= 16 && sScoreT < 49) tZoneType = normal;
            if (sScoreT >= 49 && sScoreT < 81) tZoneType = oily;
            if (sScoreT >= 81 && sScoreT <= 99) tZoneType = veryOily;
        }
        if (mScoreT >= 81 && mScoreT <= 99) {
            if (sScoreT >= 0 && sScoreT < 6) tZoneType = normal;
            if (sScoreT >= 6 && sScoreT < 16) tZoneType = normal;
            if (sScoreT >= 16 && sScoreT < 49) tZoneType = normal;
            if (sScoreT >= 49 && sScoreT < 81) tZoneType = oily;
            if (sScoreT >= 81 && sScoreT <= 99) tZoneType = veryOily;
        }

        // define U-zone skin/scalp type.
        if (mScoreU >= 0 && mScoreU < 6) {
            if (sScoreU >= 0 && sScoreU < 6) uZoneType = veryDry;
            if (sScoreU >= 6 && sScoreU < 16) uZoneType = dry;
            if (sScoreU >= 16 && sScoreU < 49) uZoneType = dry;
            if (sScoreU >= 49 && sScoreU < 81) uZoneType = oily;
            if (sScoreU >= 81 && sScoreU <= 99) uZoneType = veryOily;
        }
        if (mScoreU >= 6 && mScoreU < 16) {
            if (sScoreU >= 0 && sScoreU < 6) uZoneType = dry;
            if (sScoreU >= 6 && sScoreU < 16) uZoneType = dry;
            if (sScoreU >= 16 && sScoreU < 49) uZoneType = dry;
            if (sScoreU >= 49 && sScoreU < 81) uZoneType = oily;
            if (sScoreU >= 81 && sScoreU <= 99) uZoneType = veryOily;
        }
        if (mScoreU >= 16 && mScoreU < 49) {
            if (sScoreU >= 0 && sScoreU < 6) uZoneType = dry;
            if (sScoreU >= 6 && sScoreU < 16) uZoneType = normal;
            if (sScoreU >= 16 && sScoreU < 49) uZoneType = normal;
            if (sScoreU >= 49 && sScoreU < 81) uZoneType = oily; // Here for Uzone
            if (sScoreU >= 81 && sScoreU <= 99) uZoneType = veryOily;
        }
        if (mScoreU >= 49 && mScoreU < 81) {
            if (sScoreU >= 0 && sScoreU < 6) uZoneType = normal;
            if (sScoreU >= 6 && sScoreU < 16) uZoneType = normal;
            if (sScoreU >= 16 && sScoreU < 49) uZoneType = normal;
            if (sScoreU >= 49 && sScoreU < 81) uZoneType = oily;
            if (sScoreU >= 81 && sScoreU <= 99) uZoneType = veryOily;
        }
        if (mScoreU >= 81 && mScoreU <= 99) {
            if (sScoreU >= 0 && sScoreU < 6) uZoneType = normal;
            if (sScoreU >= 6 && sScoreU < 16) uZoneType = normal;
            if (sScoreU >= 16 && sScoreU < 49) uZoneType = normal;
            if (sScoreU >= 49 && sScoreU < 81) uZoneType = oily;
            if (sScoreU >= 81 && sScoreU <= 99) uZoneType = veryOily;
        }

        // Conclude final skin/scalp condition.
        if (tZoneType == veryDry) {
            if (uZoneType == veryDry) skinCondition = veryDry;
            if (uZoneType == dry) skinCondition = dry;
            if (uZoneType == normal) skinCondition = dry;
            if (uZoneType == oily) skinCondition = combination;
            if (uZoneType == veryOily) skinCondition = combination;
        }
        if (tZoneType == dry) {
            if (uZoneType == veryDry) skinCondition = dry;
            if (uZoneType == dry) skinCondition = dry;
            if (uZoneType == normal) skinCondition = dry;
            if (uZoneType == oily) skinCondition = combination;
            if (uZoneType == veryOily) skinCondition = combination;
        }
        if (tZoneType == normal) {
            if (uZoneType == veryDry) skinCondition = dry;
            if (uZoneType == dry) skinCondition = dry;
            if (uZoneType == normal) skinCondition = normal;
            if (uZoneType == oily) skinCondition = oily;
            if (uZoneType == veryOily) skinCondition = oily;
        }
        if (tZoneType == oily) {
            if (uZoneType == veryDry) skinCondition = combination;
            if (uZoneType == dry) skinCondition = combination;
            if (uZoneType == normal) skinCondition = oily;
            if (uZoneType == oily) skinCondition = oily;
            if (uZoneType == veryOily) skinCondition = oily;
        }
        if (tZoneType == veryOily) {
            if (uZoneType == veryDry) skinCondition = combination;
            if (uZoneType == dry) skinCondition = combination;
            if (uZoneType == normal) skinCondition = oily;
            if (uZoneType == oily) skinCondition = oily;
            if (uZoneType == veryOily) skinCondition = veryOily;
        }

        console.log('------------========', tZoneType, uZoneType, skinCondition);

        let keyword_value = '';

        switch (skinCondition) {
            case veryDry:
                keyword_value = 'very_dry';
                break;
            case dry:
                keyword_value = 'dry';
                break;
            case combination:
                keyword_value = 'combination';
                break;
            case normal:
                keyword_value = 'normal';
                break;
            case oily:
                keyword_value = 'oily';
                break;
            case veryOily:
                keyword_value = 'very_oily';
                break;
        }

        return keyword_value;
    }

    check(moisture: number, sebum: number) {
        if ((moisture === null && sebum === null) || moisture === null) {
            return {
                keyword_value: '',
                keyword_id: 0,
            };
        } else if ((moisture <= 33 && sebum <= 33) || moisture <= 33) {
            return {
                keyword_value: 'Dry',
                keyword_id: 1,
            }; // 1; //Dry
        } else if (sebum >= 66) {
            return {
                keyword_value: 'Oily',
                keyword_id: 4,
            }; //4; //Oily
        } else if ((sebum <= 34 && sebum <= 66) || sebum !== 50 || moisture !== 50) {
            return {
                keyword_value: 'Combination',
                keyword_id: 3,
            }; //3; // combination
        } else if ((moisture === 50 && sebum === 50) || moisture === 50) {
            return {
                keyword_value: 'Normal',
                keyword_id: 2,
            };
        } else {
            return null;
        }
    }

    async webResult(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            WITH _results AS (
                SELECT DISTINCT
                    type_measurements."name" AS measurement,
                    to_json(original_img.scores) ->> 'score' as value,
                    to_json(original_img.scores) ->> 'computation_score' as computation_score,
                    record.created_time::date as date,
                    record.created_time::time as time,
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
                computation_score,
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
                NAME AS measurement,
                CASE
                    WHEN id IN (16, 17) THEN 
                        CASE 
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 'Very Hydrated'
                            WHEN AVG_SCORE BETWEEN 49 AND 80.99 THEN 'Hydrated'
                            WHEN AVG_SCORE BETWEEN 16 AND 48.99 THEN 'Normal'
                            WHEN AVG_SCORE BETWEEN 7 AND 15.99 THEN 'Dehydrated'
                            WHEN AVG_SCORE BETWEEN 0 AND 5.99 THEN 'Very Dehydrated'
                        END
                    WHEN id IN (9, 5, 15) THEN 
                        CASE 
                            WHEN AVG_SCORE BETWEEN 0 AND 5 THEN 'Very Dry'
                            WHEN AVG_SCORE BETWEEN 5.99 AND 15.99 THEN 'Dry'
                            WHEN AVG_SCORE BETWEEN 16 AND 48.99 THEN 'Normal'
                            WHEN AVG_SCORE BETWEEN 49 AND 80.99 THEN 'Oily'
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 'Very Oily'
                        END
                    ELSE
                        CASE 
                            WHEN AVG_SCORE BETWEEN 0 AND 5 THEN 'Clear'
                            WHEN AVG_SCORE BETWEEN 6 AND 15.99 THEN 'Almost Clear'
                            WHEN AVG_SCORE BETWEEN 16 AND 48.99 THEN 'Mild'
                            WHEN AVG_SCORE BETWEEN 49 AND 80.99 THEN 'Moderate'
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 'Severe'
                            ELSE NULL 
                        END
                END AS keyword_value,
                CASE
                    WHEN id IN (16, 17) THEN 
                        CASE 
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 5
                            WHEN AVG_SCORE BETWEEN 50 AND 80.99 THEN 4
                            WHEN AVG_SCORE BETWEEN 17 AND 48.99 THEN 3
                            WHEN AVG_SCORE BETWEEN 7 AND 15.99 THEN 2
                            WHEN AVG_SCORE BETWEEN 0 AND 6.99 THEN 1
                        END
                    WHEN id IN (9, 5, 15) THEN 
                        CASE 
                            WHEN AVG_SCORE BETWEEN 0 AND 5 THEN 1
                            WHEN AVG_SCORE BETWEEN 5.99 AND 15.99 THEN 2
                            WHEN AVG_SCORE BETWEEN 16 AND 48.99 THEN 3
                            WHEN AVG_SCORE BETWEEN 49 AND 80.99 THEN 4
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 5
                        END
                    ELSE
                        CASE 
                            WHEN AVG_SCORE BETWEEN 0 AND 5 THEN 1
                            WHEN AVG_SCORE BETWEEN 6 AND 15.99 THEN 2
                            WHEN AVG_SCORE BETWEEN 16 AND 48.99 THEN 3
                            WHEN AVG_SCORE BETWEEN 49 AND 80.99 THEN 4
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 5
                            ELSE NULL 
                        END
                END AS keyword_id
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

    async getSkinAge(batch_id: number) {
        const result = await this.database.executeQuery(
            `SELECT scores ->> 'skinAge' as skin_age, created_time::date as date, created_time::time as time
            FROM measurements 
            WHERE batch_id = $1 AND type_image_id = 21 AND type_measurement_id = 5`,
            [batch_id],
        );

        return result;
    }
}

