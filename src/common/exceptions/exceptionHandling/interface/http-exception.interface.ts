//^ -------------------- Http -------------------- ^//
export interface HttpExceptionResponse {
    statusCode: number;
    error: string;
}

export interface CustomHttpExceptionResponse extends HttpExceptionResponse {
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
