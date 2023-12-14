import { Injectable } from '@nestjs/common';
import { WebResultService } from '../analysis/webResult/webResult.service';
import { DatabaseService } from 'src/database/database.service';
@Injectable()
export class ProductRecommendationService {
    constructor(private readonly webResult: WebResultService, private readonly database: DatabaseService) {}

    async getRecommendedProduct(batchId: number) {
        const saveSql = `
            SELECT 
                pr.name as product_name, 
                pr.collection as collection, 
                pr.image_url as image, pr."routine" as routine 
            FROM "product_recommendation_selecteds" prc
            LEFT JOIN product_recommendations pr ON pr.id = prc.product_recommendation_id
            WHERE batch_id = $1`;

        const queries = [batchId];
        const result = this.database.crmQuery(saveSql, queries);

        return result;
    }
    getTop5Measurement(result: any) {
        if (result.length === null) return [];
        result.sort((a: any, b: any) => b.value - a.value);

        const top5Value = result.slice(0, 5);

        const top5measurement = top5Value.map((item: any) => ({
            measurement: item.measurement,
            value: item.value,
        }));

        return top5measurement;
    }

    async getWebResult(batchId: number) {
        const result = await this.webResult.webResult(batchId);

        if (result.length === 0) return [];

        const avg = await this.webResult.webResultAverage(batchId);

        // console.log(result);
        let moistureT = null;
        let moistureU = null;
        let sebumT = null;
        let sebumU = null;

        for (let i = 0; i < result.length; i++) {
            // console.log(result[i]['measurement'] === );
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

            return result;
        }
    }
    async scoresSorting(batchId: number) {
        const webResult = await this.getWebResult(batchId);

        const top5mesurement = this.getTop5Measurement(webResult);

        return top5mesurement;
    }
}

