const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const analysisRoutes = require('./routes/analysis');

const app = express();
const PORT = process.env.PORT || 3001;

// 보안 미들웨어
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100 // 최대 100개 요청
});
app.use(limiter);

// CORS 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true // 프로덕션에서는 모든 origin 허용 (같은 도메인)
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 라우트
app.use('/api/analysis', analysisRoutes);
app.use('/api/admin', require('./routes/admin'));

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '서버 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 핸들링
app.use('*', (req, res) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📊 광고분석 시스템 백엔드 서버`);
}); 