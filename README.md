# 검색광고 경쟁력 분석 시스템

네이버 검색광고의 경쟁력을 분석하고 AI 기반 광고 소재를 제안하는 시스템입니다.

## 주요 기능

1. **자사 광고 분석**: 현재 광고순위, 광고평가
2. **경쟁사 분석**: 주요 5개 경쟁사의 개별 광고 순위, 광고평가  
3. **광고 소재 제안**: AI 기반 5개 광고 소재 제안 (제목, 설명, 개선포인트)

## 입력값

- 검색키워드
- 자사명
- 광고검색결과 (네이버 검색광고 영역 복사한 텍스트 또는 캡쳐 이미지)

## 기술 스택

- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- AI: OpenAI GPT-4
- OCR: Tesseract.js (이미지 처리)

## 설치 및 실행

### 자동 설치 (Windows)
```bash
install.bat
```

### 수동 설치
1. 의존성 설치:
```bash
npm run install-all
```

2. 환경변수 설정:
```bash
# server/.env 파일 생성
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=development
```

### 실행

#### 자동 실행 (Windows)
```bash
start.bat
```

#### 수동 실행
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 프로젝트 구조

```
├── client/          # React 프론트엔드
├── server/          # Node.js 백엔드
├── package.json     # 루트 패키지 설정
└── README.md        # 프로젝트 설명
``` 