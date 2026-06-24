# Dior Analysis Backend

피부 분석, 결과 생성, 추천 이메일 발송, 분석 이력 저장을 담당하는 NestJS 기반 백엔드입니다.  
이미지 분석 알고리즘과 결과 전달 계층을 분리해 운영하도록 설계했습니다.

## Overview

- 피부 분석 API 제공
- 분석 결과 및 질문 응답 처리
- 제품 추천 생성 및 이메일 전송
- 히스토리 저장 및 조회
- 이미지 업로드/처리
- 배치 처리 및 큐 기반 저장 작업
- HTTPS / SNI / Swagger / CORS 지원

## Tech Stack

- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- Bull
- Redis
- Swagger
- Nodemailer
- AWS S3 / file upload utilities
- date-fns / moment / exceljs / xlsx

## Architecture

이 서비스는 분석 알고리즘과 결과 제공 로직을 분리한 구조입니다.

- `src/modules/analysis`: 분석 오케스트레이션
- `src/modules/algorithms`: 측정 항목별 알고리즘 서비스
- `src/modules/productRecommendation`: 추천 결과 및 메일 발송
- `src/modules/customer`: 고객 분석 이력
- `src/modules/history`: 분석 히스토리
- `src/modules/images`: 이미지 업로드 및 처리
- `src/database`: DB pool 및 TypeORM 연결
- `src/common`: 공통 예외, DTO, middleware, translation

### Main Flow

1. 이미지 또는 분석 요청 수신
2. `analysis` 모듈에서 알고리즘 서비스 실행
3. 결과를 가공해 web result 또는 추천 데이터 생성
4. `productRecommendation` 모듈에서 이메일 템플릿 렌더링
5. `history` / `customerHistory`에서 이력 저장 및 조회

## Key Features

- 피부 항목별 분석 서비스 분리
- 추천 상품 이메일 자동 생성
- 분석 결과 웹 응답 제공
- 이미지 업로드 및 처리
- 질문지 기반 분석 플로우 지원
- 배치 분석 및 비동기 처리
- 헬스체크 엔드포인트 제공

## Folder Structure

```text
src
├─ common
├─ config
├─ database
├─ modules
│  ├─ analysis
│  ├─ algorithms
│  ├─ customer
│  ├─ history
│  ├─ images
│  ├─ productRecommendation
│  ├─ timestamp
│  └─ health
└─ main.ts
```

## Run Locally

```bash
npm install
npm run dev
```

## Environment Variables

`.env` 또는 배포 환경에서 주로 사용하는 항목:

```bash
PORT=3000
HOSTNAME=localhost
HTTP=3001
SSL=false
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=*****
POSTGRES_DB=*****
POSTGRES_DIOR_DB=*****
POSTGRES_PASSWORD_DIOR=*****
CHOWIS_SSL_KEY_PATH=*****
CHOWIS_SSL_CERT_PATH=*****
CHOICEDX_SSL_KEY_PATH=*****
CHOICEDX_SSL_CERT_PATH=*****
```

## Scripts

```bash
npm run dev
npm run start
npm run start:prod
npm run test
npm run test:e2e
npm run migration:run
```

## Portfolio Notes

- 분석 알고리즘을 도메인별 서비스로 쪼개 확장 가능한 구조를 만들었습니다.
- 추천 결과, 이메일 발송, 이력 저장을 분리해 책임을 명확히 했습니다.
- 큐, DB pool, TypeORM을 함께 사용해 비동기 처리와 데이터 저장을 안정적으로 구성했습니다.
