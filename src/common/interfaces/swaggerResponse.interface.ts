export interface AllResponse {
    status: number;
    message: string;
    body: {
        result: ImageResult[];
        computation_score: string;
        questionnaire_score: string;
        score_average: string;
    };
}

export interface ImageResult {
    batchId: number;
    algorithm_type: string;
    ver: string;
    score: number;
    analyzedImage: Image;
    originalImage: Image;
    maskImage: Image;
}

export interface Image {
    id: string;
    url: string;
}

