@echo off
echo 검색광고 경쟁력 분석 시스템 설치 중...

echo.
echo 1. 루트 의존성 설치 중...
call npm install

echo.
echo 2. 서버 의존성 설치 중...
cd server
call npm install
cd ..

echo.
echo 3. 클라이언트 의존성 설치 중...
cd client
call npm install
cd ..

echo.
echo 설치가 완료되었습니다!
echo.
echo 실행 방법:
echo 1. server/.env 파일을 생성하고 OPENAI_API_KEY를 설정하세요
echo 2. npm run dev 명령어로 개발 서버를 시작하세요
echo.
pause 