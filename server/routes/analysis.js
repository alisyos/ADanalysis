const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeAds } = require('../services/adAnalysisService');
const { processImage } = require('../services/ocrService');

const router = express.Router();

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

// 광고 분석 API
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const { keyword, companyName, adText } = req.body;

    // 입력값 검증
    if (!keyword || !companyName) {
      return res.status(400).json({
        error: '검색키워드와 자사명은 필수입니다.'
      });
    }

    let processedText = adText || '';

    // 이미지가 업로드된 경우 OCR 처리
    if (req.file) {
      try {
        console.log('이미지 OCR 처리 시작:', req.file.filename);
        processedText = await processImage(req.file.path);
        
        // 처리 완료 후 파일 삭제
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('파일 삭제 오류:', err);
        });
      } catch (ocrError) {
        console.error('OCR 처리 오류:', ocrError);
        return res.status(500).json({
          error: 'OCR 처리 중 오류가 발생했습니다.',
          details: ocrError.message
        });
      }
    }

    if (!processedText.trim()) {
      return res.status(400).json({
        error: '광고 텍스트 또는 이미지가 필요합니다.'
      });
    }

    console.log('광고 분석 시작:', { keyword, companyName, textLength: processedText.length });

    // 광고 분석 수행
    const analysisResult = await analyzeAds({
      keyword,
      companyName,
      adText: processedText
    });

    res.json({
      success: true,
      data: analysisResult,
      processedText: processedText.substring(0, 200) + '...' // 처리된 텍스트 일부만 반환
    });

  } catch (error) {
    console.error('광고 분석 오류:', error);
    res.status(500).json({
      error: '광고 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 분석 상태 확인 API
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      ocr: true
    }
  });
});

module.exports = router; 