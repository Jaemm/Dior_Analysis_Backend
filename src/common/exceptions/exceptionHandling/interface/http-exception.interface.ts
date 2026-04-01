//^ -------------------- Http -------------------- ^//
export interface HttpExceptionResponse {
    statusCode: number;
    error: string;
    message?: string | string[];
}

export interface CustomHttpExceptionResponse extends HttpExceptionResponse {
    result_code?: number;
    path: string;
    method: string;
    message: string;
    timeStamp: Date;
}

//^ -------------------- Inumber -------------------- ^//
export interface CommonErrorResponse {
    RESULTCODE: string;
    RESULTMSG: string;
}
