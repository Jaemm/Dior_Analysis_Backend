
import { Injectable, Inject} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';


@Injectable()
export class HistoryService {
    constructor(private database: DatabaseService, ){}

    async getAnalysisImage(batch_id: number){
        const batchRes = await this.database.executeQuery
        (` 
            SELECT t_img."name" as image_name, an.args ->> 'deviceOS' as deviceOS, an.args ->> 'deviceModel' as deviceMode, an.args ->> 'latitude' as latitude, an.args ->> 'longitude' as longitude, img.url as imageUrl
            FROM analysis as an
            INNER JOIN (SELECT DISTINCT type_image_id, url, batch_id FROM images) as img ON img.batch_id = an.batch_id
            INNER JOIN (SELECT * FROM type_images GROUP BY name, id) as t_img ON t_img."id" = img.type_image_id
            WHERE an.batch_id = ${batch_id};
        
        `)
        const getImage = batchRes['rows']
        let ressObj = {}
        if(batchRes['rowCount'] || batchRes['rowCount'] > 0){
            let front_xpl = null
            let front_ppl =  null 
            let left_ppl =  null
            let right_ppl =  null
            let left_xpl =  null
            let right_xpl =  null
            let uvl_impurities = null
            let front_uvl =  null
            let left_uvl =  null
            let right_uvl =  null

            for(let i = 0; i < getImage.length; i ++) {
                if(getImage[i].image_name == 'front_xpl') front_xpl = getImage[i]['imageurl']
                if(getImage[i].image_name == 'front_ppl') front_ppl = getImage[i]['imageurl']
                if(getImage[i].image_name == 'left_ppl') left_ppl = getImage[i]['imageurl']
                if(getImage[i].image_name == 'right_ppl') right_ppl = getImage[i]['imageurl']
                if(getImage[i].image_name == 'left_xpl') left_xpl = getImage[i]['imageurl']
                if(getImage[i].image_name == 'right_xpl') right_xpl = getImage[i]['imageurl']
                if(getImage[i].image_name == 'uvl_impurities') uvl_impurities = getImage[i]['imageurl']
                if(getImage[i].image_name == 'front_uvl') front_uvl = getImage[i]['imageurl']
                if(getImage[i].image_name == 'left_uvl') left_uvl = getImage[i]['imageurl']
                if(getImage[i].image_name == 'right_uvl') right_uvl = getImage[i]['imageurl']
            }

            ressObj = {
                batch_id: batch_id,
                metaData : {deviceOs: getImage[0]['deviceos'], deviceModel: getImage[0]['devicemode']},
                originalImage: {
                    front_xpl: front_xpl,
                    front_ppl: front_ppl,
                    left_ppl: left_ppl,
                    right_ppl: right_ppl,
                    left_xpl: left_xpl,
                    right_xpl: right_xpl,
                    uvl_impurities: uvl_impurities,
                    front_uvl: front_uvl,
                    left_uvl: left_uvl,
                    right_uvl : right_uvl     
                },
                marskValue: undefined            
            }
        }
        return ressObj

    }

    async getMesurementMask(batch_id: any){
        try{
            const result = await this.database.executeQuery
                (
                    `
                    SELECT t_msr."name"  as measurements,
                        msr.args as elasticity,
                        (msr.args ->> 'images') as mask_image,
                        (msr.args ->> 'score') as score,
                        (msr.args ->> 'rawValues') as rawValues
                    FROM analysis as an
                    INNER JOIN measurements as msr ON msr.batch_id = an.batch_id
                    INNER JOIN (SELECT * FROM type_measurements GROUP BY name, id) as t_msr ON t_msr.id = msr.type_measurement_id
                    WHERE an.batch_id = ${batch_id};
                    `
                )
            let returnObj = {};
            let redness = null
            let oiliness = null
            let radiance = null
            let dullness = null
            let pores = null
            let impurities = null
            let wrinkle = null
            let dark_circle = null
            let hyperpigmentation = null
            let pigmentation = null
            let additonalResult = null
            let measurRes = result['rows'];
            let elesticity_score = null;
            let skin_age = null;
            let skin_condition = null;



            if(result['rowCount'] > 0){
                for(let i = 0; i < measurRes.length; i++){
                    if(measurRes[i].measurements === 'elasticity'){
                        elesticity_score = measurRes[i]?.elasticity?.args?.elesticity_score;
                        skin_age = measurRes[i]?.elasticity?.args?.skin_age;
                        skin_condition = measurRes[i]?.elasticity?.args?.skin_condition;
                    }
                    if(measurRes[i].measurements === 'redness'){    
                        redness = { 
                                images: {
                                    front: JSON.parse(measurRes[i]?.mask_image)?.front?.url,
                                    left: JSON.parse(measurRes[i]?.mask_image)?.left?.url,
                                    right: JSON.parse(measurRes[i]?.mask_image)?.right?.url,
                                },
                                score: JSON.parse(measurRes[i]?.score),
                                rawValues: JSON.parse(measurRes[i]?.rawvalues)   
                        }
                    }
                    if(measurRes[i].measurements === 'oiliness'){   
                        oiliness = {
                            score: JSON.parse(measurRes[i].score)?.oiliness_final_score,
                            rawValues: JSON.parse(measurRes[i].score)?.oiliness_raw, 
                            images: {
                                frontW: JSON.parse(measurRes[i]?.mask_image)?.frontW?.url,
                                frontG: JSON.parse(measurRes[i]?.mask_image)?.frontG?.url,  
                            }
                        }
                    }
                   
                    if(measurRes[i].measurements === 'dullness'){     
                        dullness = {
                            score: JSON.parse(measurRes[i].score)?.dullness_final_score,
                            final_raw: JSON.parse(measurRes[i].score)?.dullness_final_score, 
                            images: {
                                frontW: JSON.parse(measurRes[i]?.mask_image)?.frontW?.url,
                                frontG: JSON.parse(measurRes[i]?.mask_image)?.frontG?.url,  
                            }
                        }
                    }
                    if(measurRes[i].measurements === 'pores'){    
                        pores = {
                            score: JSON.parse(measurRes[i].score)?.pores_final_score,
                            rawValues: JSON.parse(measurRes[i].score)?.pores_final_raw, 
                            image: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url
                            }
                        }
                    }
                    if(measurRes[i].measurements === 'radiance'){    
                        radiance = {
                            score: JSON.parse(measurRes[i].score)?.radiance_final_score,
                            rawValues: JSON.parse(measurRes[i].score)?.radiance_final_raw, 
                            image: {
                                frontW: JSON.parse(measurRes[i]?.mask_image)?.frontW?.url,
                                frontG: JSON.parse(measurRes[i]?.mask_image)?.frontG?.url, 
                            }
                        }
                    }
                    if(measurRes[i].measurements === 'impurities'){    
                        impurities = {
                            score: JSON.parse(measurRes[i].score)?.impurities_final_score,
                            rawValues: JSON.parse(measurRes[i].score)?.impurities_final_raw, 
                            images: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url
                            }
                        }
                    }

                    if(measurRes[i].measurements === 'wrinkles'){    
                        wrinkle = { 
                            images: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url,
                                left: JSON.parse(measurRes[i]?.mask_image)?.left?.url,
                                right: JSON.parse(measurRes[i]?.mask_image)?.right?.url,
                            },
                            score: JSON.parse(measurRes[i]?.score),
                            rawValues: JSON.parse(measurRes[i]?.rawvalues)
                        }
                    }
                    if(measurRes[i].measurements === 'darkcircle'){    
                        dark_circle = { 
                            images: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url,
                            },
                            score: JSON.parse(measurRes[i]?.score),
                            rawValues: JSON.parse(measurRes[i]?.rawvalues)
                        }
                    }
                    //hyperpigmentation
                    if((measurRes[i].measurements) === 'hyperpigmentation'){    
                        hyperpigmentation = { 
                            images: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url,
                                left: JSON.parse(measurRes[i]?.mask_image)?.left?.url,
                                right: JSON.parse(measurRes[i]?.mask_image)?.right?.url,
                            },
                            score: JSON.parse(measurRes[i]?.score),
                            rawValues: JSON.parse(measurRes[i]?.rawvalues)
                        }
                    }
                    if(measurRes[i].measurements === 'pigmentation'){    

                        pigmentation = { 
                            images: {
                                front: JSON.parse(measurRes[i]?.mask_image)?.front?.url,
                                left: JSON.parse(measurRes[i]?.mask_image)?.left?.url,
                                right: JSON.parse(measurRes[i]?.mask_image)?.right?.url,
                            },
                            score: JSON.parse(measurRes[i]?.score),
                            rawValues: JSON.parse(measurRes[i]?.rawvalues)
                        }
                    }
                }

                returnObj = {
                    redness: redness,
                    oiliness: oiliness,
                    radiance: radiance,
                    dullness: dullness,
                    pores: pores,
                    impurities: impurities,
                    wrinkle: wrinkle,
                    dark_circle: dark_circle,
                    hyperpigmentation: hyperpigmentation,
                    pigmentation: pigmentation,
                    elesticity_score: elesticity_score,
                    skin_age: skin_age,
                    skin_condition: skin_condition,
                }
            }
            return returnObj     
        }catch(e){
            throw new Error(e);
        }
    }

    async getSingleAnalysis(batch_id: number) {
        let getImage = await this.getAnalysisImage(batch_id);
        const getMeasurment = await this.getMesurementMask(batch_id)
        
        // getImage.marskValue = getMeasurment

        return {...getImage, rawResult: getMeasurment}
    }

    async getCustomerAnalysis (customer_id: number, offset: number, limit:  number) {
        
        const count = await this.database.executeQuery(`SELECT COUNT(*) FROM analysis WHERE customer_id = ${customer_id}`)

        let off = offset ? offset : 1;
        let lim = limit ? limit : 10000
        const batchRes = await this.database.executeQuery
        (` 
            SELECT * 
            FROM analysis
            WHERE customer_id = ${customer_id}
            LIMIT ${lim}
            OFFSET ${off}
        `)
        

        return {
            count: count['rows'][0]['count'],
            data: batchRes['rows'],
        }
    }
}