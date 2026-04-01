import { number } from '@hapi/joi';
import { ConsoleLogger, Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class ComputationService {
    private readonly logger = new ConsoleLogger(ComputationService.name);

    constructor() {}

    skinAge(wrinkleCal: number, pigmCalc: number, birth_year: number) {
        let now_year = new Date().getFullYear();
        let biologic_age = Number(now_year) - Number(birth_year);

        let skin_age = Math.round(100 - (Number(wrinkleCal) + Number(pigmCalc)) / 2);

        if (!wrinkleCal || !pigmCalc || wrinkleCal === null || pigmCalc === null) return biologic_age;

        if (skin_age >= 0 && skin_age <= 12) {
            skin_age = biologic_age + 4;
        }
        if (skin_age >= 13 && skin_age <= 24) {
            skin_age = biologic_age + 3;
        }
        if (skin_age >= 25 && skin_age <= 36) {
            skin_age = biologic_age + 2;
        }
        if (skin_age >= 37 && skin_age <= 48) {
            skin_age = biologic_age + 1;
        }
        if (skin_age >= 49 && skin_age <= 60) {
            skin_age = biologic_age - 1;
        }

        if (skin_age >= 61 && skin_age <= 72) {
            skin_age = biologic_age - 2;
        }

        if (skin_age >= 73 && skin_age <= 84) {
            skin_age = biologic_age - 3;
        }

        if (skin_age >= 85 && skin_age <= 100) {
            skin_age = biologic_age - 4;
        }

        return skin_age;
    }
    // SKIN QUESTIONNAIRES
    quest_score(ans: any) {
        //1 -> 1
        //2 -> 2
        //3 -> 3
        //4 -> 4
        //5 -> 2.5
        ans = ans?.length === undefined ? '' : ans;
        let ansArr = ans.split('');
        let length = ansArr.length;
        let result = 0;

        let questionnaire_score = 0;
        for (let i = 0; i < ansArr.length; i++) {
            if (ansArr[i] === 'A' || ansArr[i] === '1') {
                questionnaire_score += 1;
            } else if (ansArr[i] === 'B' || ansArr[i] === '2') {
                questionnaire_score += 2;
            } else if (ansArr[i] === 'C' || ansArr[i] === '3') {
                questionnaire_score += 3;
            } else if (ansArr[i] === 'D' || ansArr[i] === '4') {
                questionnaire_score += 4;
            } else if (ansArr[i] === 'E' || ansArr[i] === '5') {
                questionnaire_score += 2.5;
            }
        }
        if (questionnaire_score === 0) return 0;
        result = (questionnaire_score - length) / (4 * length - length);
        result = Math.round(result * 99);
        return result;
    }
    // Questionnaire managament
    questionnaireFrequency(answers: string, algoId: any) {
        // 2 weeks --> length = 4
        // 5. Oiliness --> Q1, 10. Redness --> Q2, 6. Spots ----> Q3, 7. Wrinkles ---> Q4
        let extractAnswer = '';
        let questionnaireScore = 0;
        if (!answers || answers?.length === 0) {
            return questionnaireScore;
        }
        if (answers.length === 4) {
            if (algoId === 5) {
                extractAnswer = answers[0];

                questionnaireScore = this.quest_score(extractAnswer);
            } else if (algoId === 10) {
                extractAnswer = answers[1];

                questionnaireScore = this.quest_score(extractAnswer);
            } else if (algoId === 6) {
                extractAnswer = answers[2];

                questionnaireScore = this.quest_score(extractAnswer);
            } else if (algoId === 7) {
                extractAnswer = answers[3];

                questionnaireScore = this.quest_score(extractAnswer);
            } else {
                questionnaireScore = 0;
            }
            // .slice(0, 9)
            // 6. Oiliness --> Q0 - Q4, 10. Redness --> Q4 - Q9, 6. Spots ----> Q9 ---> Q12, 7. Wrinkles ---> Q12 - Q17
        } else {
            if (algoId === 5) {
                extractAnswer = answers.slice(0, 4);

                questionnaireScore = this.quest_score(extractAnswer);
            } else if (algoId === 10) {
                extractAnswer = answers.slice(4, 9);

                questionnaireScore = this.quest_score(extractAnswer);
            } else if (algoId === 6) {
                extractAnswer = answers.slice(9, 12);

                questionnaireScore = this.quest_score(extractAnswer);
            } else if (algoId === 7) {
                extractAnswer = answers.slice(12, 17);

                questionnaireScore = this.quest_score(extractAnswer);
            } else {
                questionnaireScore = 0;
            }

            return questionnaireScore;
        }
    }

    cndp_computation(analysis_type: any, scores: number[], answers: any) {
        // No analysis or questionnaire is done.
        let questionnaire_score = 0;
        let combined_scores = 0;
        let computed_score = 0;
        // wrinkles
        if (analysis_type === 7) {
            questionnaire_score = this.questionnaireFrequency(answers, 7);
            combined_scores = scores.reduce((accumulator, currentValue) => accumulator + currentValue);
            const avg = Math.round(combined_scores / scores.length);
            // quest_score
            computed_score = 0.8 * avg + 0.2 * questionnaire_score;

            if (questionnaire_score === 0) {
                computed_score = avg;
                questionnaire_score = 0;
            }

            return {
                computed_score: computed_score,
                questionnaire_score: questionnaire_score,
            };
        }
        // spots
        else if (analysis_type === 6) {
            combined_scores = scores.reduce((accumulator, currentValue) => accumulator + currentValue);
            const avg = Math.round(combined_scores / scores.length);

            questionnaire_score = this.questionnaireFrequency(answers, 6);

            computed_score = 0.8 * avg + 0.2 * questionnaire_score;
            if (questionnaire_score === 0) {
                computed_score = avg;
                questionnaire_score = 0;
            }

            return {
                computed_score: computed_score,
                questionnaire_score: questionnaire_score,
            };
        }
        // sensitivity redness
        else if (analysis_type === 10) {
            combined_scores = scores.reduce((accumulator, currentValue) => accumulator + currentValue);
            questionnaire_score = this.questionnaireFrequency(answers, 10);
            const avg = Math.round(combined_scores / scores.length);

            computed_score = 0.8 * avg + 0.2 * questionnaire_score;
            if (questionnaire_score === 0) {
                computed_score = avg;
                questionnaire_score = 0;
            }
            return {
                computed_score: computed_score,
                questionnaire_score: questionnaire_score,
            };
        }
        // Oiliness
        else if (analysis_type === 5) {
            questionnaire_score = this.questionnaireFrequency(answers, 5);
            combined_scores = scores.reduce((accumulator, currentValue) => accumulator + currentValue);
            const avg = Math.round(combined_scores / scores.length);

            computed_score = 0.8 * avg + 0.2 * questionnaire_score;

            if (questionnaire_score === 0) {
                computed_score = avg;
                questionnaire_score = 0;
            }

            return {
                computed_score: computed_score,
                questionnaire_score: questionnaire_score,
            };
            // porphyrin
        } else {
            computed_score = scores.reduce((accumulator, currentValue) => accumulator + currentValue);
            computed_score = Math.round(computed_score / scores.length);
            return {
                computed_score: computed_score,
                questionnaire_score: 0,
            };
        }
    }

    computationResult(type: number, answers: string, score: any) {
        try {
            let final_response: any = {};

            let myScores: number[];
            if (Array.isArray(score) === false) {
                myScores.push(score);
            } else {
                myScores = score;
            }

            // computed_score
            // questionnaire_score
            const { computed_score, questionnaire_score } = this.cndp_computation(type, myScores, answers);

            let keyWord;
            let keyword_id;

            if (computed_score >= 0 && computed_score < 6) {
                keyWord = 'Clear';
                keyword_id = 1;
            } else if (computed_score >= 6 && computed_score < 16) {
                keyWord = 'Almost Clear';
                keyword_id = 2;
            } else if (computed_score >= 16 && computed_score < 49) {
                keyWord = 'Mild';
                keyword_id = 3;
            } else if (computed_score >= 49 && computed_score < 81) {
                keyWord = 'Moderate';
                keyword_id = 4;
            } else if (computed_score >= 81 && computed_score <= 100) {
                keyWord = 'Severe';
                keyword_id = 5;
            } else {
                keyWord = 'Unknown'; // Handle the case when the number is outside the defined ranges
            }
            final_response.computation_score = computed_score;
            final_response.questionnaire_score = questionnaire_score;
            final_response.keyWord = keyWord;
            final_response.keyword_id = keyword_id;

            return final_response;
        } catch (e) {
            this.logger.error(`[computationResult] ${e instanceof Error ? e.message : e}`);
            throw new InternalServerErrorException('Failed to compute result.');
        }
    }
}
