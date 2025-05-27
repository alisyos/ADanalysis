# 검색광고 경쟁력 분석 시스템

AI 기반 네이버 검색광고 분석 및 소재 제안 시스템입니다.

## 주요 기능

- 네이버 검색광고 텍스트/이미지 분석
- 자사 광고 품질 평가 및 순위 확인
- 경쟁사 광고 분석 (상위 5개)
- AI 기반 광고 소재 제안 (5개)
- 관리자 페이지를 통한 시스템 프롬프트 관리
- 태그 키워드 자동 분류

## 입력값

- 검색키워드
- 자사명
- 광고검색결과 (네이버 검색광고 영역 복사한 텍스트 또는 캡쳐 이미지)

## 기술 스택

### 프론트엔드
- React 18 + TypeScript
- Tailwind CSS
- Axios

### 백엔드
- Node.js + Express
- OpenAI GPT-4.1
- Tesseract.js (OCR)
- Multer (파일 업로드)

## 로컬 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/alisyos/ADanalysis.git
cd ADanalysis
```

### 2. 의존성 설치 (자동)
```bash
# Windows
install.bat

# 또는 수동 설치
npm run install-all
```

### 3. 환경변수 설정
```bash
# server/.env 파일 생성
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

### 4. 개발 서버 실행
```bash
# Windows
start.bat

# 또는 수동 실행
npm run dev
```

- 프론트엔드: http://localhost:3000
- 백엔드: http://localhost:3001

## Vercel 배포

### 1. Vercel 계정 연결
1. [Vercel](https://vercel.com/)에 가입/로그인
2. GitHub 저장소 연결
3. 프로젝트 import

### 2. 환경변수 설정
Vercel 대시보드에서 다음 환경변수를 설정하세요:
```
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
```

### 3. 배포 설정
- `vercel.json` 파일이 자동으로 배포 설정을 처리합니다
- 프론트엔드와 백엔드가 하나의 도메인에서 서비스됩니다

### 4. 자동 배포
- `main` 브랜치에 push하면 자동으로 배포됩니다
- 각 PR마다 프리뷰 배포가 생성됩니다

## 사용 방법

1. **검색키워드 입력**: 분석하고자 하는 검색어 입력
2. **자사명 입력**: 자사 회사명 입력
3. **광고 데이터 입력**: 
   - 텍스트 직접 입력 또는
   - 스크린샷 이미지 업로드
4. **분석 실행**: AI가 자동으로 분석 수행
5. **결과 확인**: 탭별로 구분된 분석 결과 확인

## 관리자 기능

- **시스템 프롬프트 관리**: GPT 분석 품질 향상을 위한 프롬프트 편집
- **실시간 적용**: 프롬프트 변경사항이 즉시 반영
- **기본값 복원**: 언제든지 기본 프롬프트로 초기화 가능

## 라이선스

MIT License

## 기여

이슈 리포트나 기능 제안은 GitHub Issues를 통해 해주세요.

## 프로젝트 구조

```
├── client/          # React 프론트엔드
├── server/          # Node.js 백엔드
├── package.json     # 루트 패키지 설정
└── README.md        # 프로젝트 설명
``` 