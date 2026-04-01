import { Logger } from '@nestjs/common';
import * as winston from 'winston';
import * as winstonDaily from 'winston-daily-rotate-file';

export class LoggerLibrary extends Logger {
    //^ REST API 로그
    log(message: string) {
        /* your implementation */
        logger.info(message);
        // super.log(message);
    }
    error(message: any) {
        /* your implementation */
        logger.error(JSON.stringify(message), new Error(message));
        // super.error(message, new Error(message));
        super.error(message);
    }
    warn(message: string) {
        /* your implementation */
        logger.warn(message);
        super.warn(message);
    }
    debug(message: string) {
        /* your implementation */
        logger.debug(message);
        super.debug(message);
    }
    verbose(message: string) {
        /* your implementation */
        logger.verbose(message);
        super.verbose(message);
    }
    //^ Query 로그
    query(message: string) {
        /* your implementation */
        queryLogger.info(message);
        // super.log(message);
    }
    queryError(message: string) {
        /* your implementation */
        queryLogger.error(message);
        // super.log(message);
    }
    querySlow(message: string) {
        /* your implementation */
        queryLogger.warn(message);
        // super.log(message);
    }
    //^ Query 로그
    axios(message: string) {
        /* your implementation */
        axiosLogger.info(message);
        // super.log(message);
    }
    axiosError(message: string) {
        /* your implementation */
        axiosLogger.error(message);
        // super.log(message);
    }
    axiosSlow(message: string) {
        /* your implementation */
        axiosLogger.warn(message);
        // super.log(message);
    }
}

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
};

const { combine, timestamp, printf, prettyPrint } = winston.format;
const logFormat = printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
});
const logger = winston.createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        logFormat,
        prettyPrint(),
    ),
    transports: [
        //* 모든 레벨 로그를 저장할 파일 설정
        new winstonDaily({
            level: 'debug',
            datePattern: 'YYYY-MM-DD',
            dirname: 'logs/all',
            filename: `%DATE%.all.log`,
            maxFiles: 30, // 30일치 로그 파일 저장
            zippedArchive: true,
        }),
        //* error 레벨 로그를 저장할 파일 설정
        new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: 'logs/error', // error.log 파일은 /logs/error 하위에 저장
            filename: `%DATE%.error.log`,
            maxFiles: 30,
            zippedArchive: true,
        }),
    ],
});
const queryLogger = winston.createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        logFormat,
        prettyPrint(),
    ),
    transports: [
        //* info(query) 레벨 로그를 저장할 파일 설정
        new winstonDaily({
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            dirname: 'logs/query',
            filename: `%DATE%.query.log`,
            maxFiles: 30, // 30일치 로그 파일 저장
            zippedArchive: true,
        }),
        //* warn(query) 레벨 로그를 저장할 파일 설정
        new winstonDaily({
            level: 'warn',
            datePattern: 'YYYY-MM-DD',
            dirname: 'logs/query',
            filename: `%DATE%.slow.log`,
            maxFiles: 30, // 30일치 로그 파일 저장
            zippedArchive: true,
        }),
        //* error(query) 레벨 로그를 저장할 파일 설정
        new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: 'logs/query',
            filename: `%DATE%.error.log`,
            maxFiles: 30, // 30일치 로그 파일 저장
            zippedArchive: true,
        }),
    ],
});
const axiosLogger = winston.createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        logFormat,
        prettyPrint(),
    ),
    transports: [
        //* info(axios) 레벨 로그를 저장할 파일 설정
        new winstonDaily({
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            dirname: 'logs/axios/all',
            filename: `%DATE%.axios.all.log`,
            maxFiles: 30, // 30일치 로그 파일 저장
            zippedArchive: true,
        }),
        //* warn(axios) 레벨 로그를 저장할 파일 설정
        new winstonDaily({
            level: 'warn',
            datePattern: 'YYYY-MM-DD',
            dirname: 'logs/axios/slow',
            filename: `%DATE%.axios.slow.log`,
            maxFiles: 30, // 30일치 로그 파일 저장
            zippedArchive: true,
        }),
        //* error(axios) 레벨 로그를 저장할 파일 설정
        new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: 'logs/axios/error',
            filename: `%DATE%.axios.error.log`,
            maxFiles: 30, // 30일치 로그 파일 저장
            zippedArchive: true,
        }),
    ],
});
