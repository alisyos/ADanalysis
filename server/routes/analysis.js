const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeAds } = require('../services/adAnalysisService');

const router = express.Router();

// Multer 설정 (메모리 저장소 사용)
const upload = multer({
  storage: multer.memoryStorage(),
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

    // 텍스트 또는 이미지 중 하나는 필수
    if (!adText && !req.file) {
      return res.status(400).json({
        error: '광고 텍스트 또는 이미지가 필요합니다.'
      });
    }

    console.log('광고 분석 시작:', {
      keyword,
      companyName,
      hasText: !!adText,
      hasImage: !!req.file,
      imageSize: req.file?.size
    });

    // 광고 분석 수행 (GPT Vision API 사용)
    const analysisResult = await analyzeAds({
      keyword,
      companyName,
      adText,
      imageBuffer: req.file?.buffer
    });

    res.json({
      success: true,
      data: analysisResult
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
      vision: true
    }
  });
});

module.exports = router; 