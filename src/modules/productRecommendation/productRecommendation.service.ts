import { Injectable } from '@nestjs/common';
import { WebResultService } from '../analysis/webResult/webResult.service';
import { DatabaseService } from 'src/database/database.service';
import * as fs from 'fs';
import * as path from 'path';
import { LanaguageToCountryService } from 'src/common/translation/languageMatch';

@Injectable()
export class ProductRecommendationService {
    private translations: Record<string, Record<string, string>>;
    constructor(
        private readonly webResult: WebResultService,
        private readonly database: DatabaseService,
        private languageCode: LanaguageToCountryService,
    ) {}

    translation(key: string, language: string) {
        const filePath = `${process.env.Translation}/webResult.json`;

        const fileContent = fs.readFileSync(filePath, 'utf8');
        this.translations = JSON.parse(fileContent);

        if (this.translations[language] && this.translations[language][key]) {
            console.log(this.translations[language]);
            return this.translations[language][key];
        } else {
            return this.translations['en'];
        }
    }

    async getRecommendedProduct(batchId: number, language: string) {
        let saveSql;
        let result;

        const newCode = this.languageCode.lanaguageToCountry(language.toLocaleUpperCase()) ?? 'EN';

        if (language === 'en') {
            saveSql = `
                SELECT 
                    pr.name as product_name, 
                    pr.collection as collection, 
                    pr.image_url as image, 
                    pr."routine" as routine 
                FROM "product_recommendation_selecteds" prc
                LEFT JOIN product_recommendations pr ON pr.id = prc.product_recommendation_id
                WHERE batch_id = $1 AND prc.created_at > '2024-01-01'`;
            const queries = [batchId];
            result = await this.database.crmQuery(saveSql, queries);
        } else {
            saveSql = `
                SELECT
                    pt."value" as product_name,
                    pr.name AS english_name,
                    collection_translation as collection,
                    collection as collection_english,
                    pr.image_url AS image,
                    pr."routine" as routine
                FROM
                    "product_recommendation_selecteds" prc
                LEFT JOIN
                    "product_recommendations" pr ON pr.ID = prc.product_recommendation_id
                LEFT JOIN
                    (
                        SELECT product_recommendation_id, value
                        FROM product_translations
                        WHERE code = $2
                    ) AS pt ON (prc.product_recommendation_id)::text = (pt.product_recommendation_id)::text
                LEFT JOIN 
                    (
                        SELECT pa.typ, pa.value as value, pat."value" as collection_translation
                        FROM product_attributes pa 
                        LEFT JOIN product_attribute_translations pat ON pat.product_attribute_id = pa.id
                        LEFT JOIN consultant_countries cc ON cc.name = pat."language"
                        WHERE typ = 'Collection' AND cc."code" = $2
                    ) AS at ON at.value	= collection
                WHERE
                    prc.batch_id = $1
                    AND prc.created_at > '2024-01-01';`;
            console.log('newCode.toUpperCase()', newCode.toUpperCase());
            const queries = [batchId, newCode.toUpperCase()];
            result = await this.database.crmQuery(saveSql, queries);

            result.forEach((val: any) => {
                val.product_name = val.product_name === null ? val.english_name : val.product_name;
                val.collection = val.collection === null ? val.collection_english : val.collection;
            });
        }

        return result;
    }

    getTop5Measurement(result: any, language: string) {
        if (result.length === null) return [];
        const measurementValuesToDelete = ['moistureT', 'moistureU'];
        const results = result.filter((obj: any) => !measurementValuesToDelete.includes(obj.measurement));

        results.sort(
            (a: any, b: any) => Math.floor(b.avg_value || b.value || 0) - Math.floor(a.avg_value || a.value || 0),
        );

        const top5Value = results.slice(0, 5);

        const top5measurement = top5Value.map((item: any) => ({
            measurement: this.translation(item.measurement, language),
            value: Math.floor(Number(item.avg_value) || Number(item.value) || 0),
        }));

        return top5measurement;
    }

    async scoresSorting(batchId: number, language: string) {
        const webResult = await this.webResult.finaleWebResult(batchId);

        const top5mesurement = this.getTop5Measurement(webResult, language);

        return top5mesurement;
    }
}

