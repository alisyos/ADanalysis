const multer = require('multer');
const { analyzeAds } = require('../server/services/adAnalysisService');
const { extractTextFromImage } = require('../server/services/ocrService');

// Multer 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  },
});

// Vercel API Route 핸들러
export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // 상태 확인
    return res.json({
      success: true,
      message: '광고 분석 API가 정상 작동 중입니다.',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    try {
      // Multer를 Promise로 래핑
      await new Promise((resolve, reject) => {
        upload.single('image')(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const { keyword, companyName, adText } = req.body;

      // 입력값 검증
      if (!keyword || !companyName) {
        return res.status(400).json({
          success: false,
          error: '검색키워드와 자사명은 필수입니다.'
        });
      }

      let finalAdText = adText;

      // 이미지가 있으면 OCR 처리
      if (req.file) {
        try {
          console.log('이미지 OCR 처리 시작, 파일 크기:', req.file.size);
          
          // 파일 크기 제한 (5MB)
          if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({
              success: false,
              error: '이미지 파일 크기는 5MB 이하여야 합니다.'
            });
          }

          // OCR 처리에 타임아웃 설정 (25초)
          const ocrPromise = extractTextFromImage(req.file.buffer);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OCR 처리 시간 초과')), 25000)
          );

          finalAdText = await Promise.race([ocrPromise, timeoutPromise]);
          
          if (!finalAdText || finalAdText.trim().length < 10) {
            return res.status(400).json({
              success: false,
              error: '이미지에서 충분한 텍스트를 추출할 수 없습니다. 더 선명한 이미지를 사용해주세요.'
            });
          }

          console.log('OCR 처리 완료, 텍스트 길이:', finalAdText.length);
          
        } catch (ocrError) {
          console.error('OCR 처리 오류:', ocrError);
          return res.status(400).json({
            success: false,
            error: 'OCR 처리 중 오류가 발생했습니다. 이미지가 선명한지 확인하거나 텍스트로 직접 입력해주세요.'
          });
        }
      }

      if (!finalAdText) {
        return res.status(400).json({
          success: false,
          error: '광고 텍스트 또는 이미지가 필요합니다.'
        });
      }

      // 광고 분석 수행
      const result = await analyzeAds({
        keyword,
        companyName,
        adText: finalAdText
      });

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('분석 오류:', error);
      return res.status(500).json({
        success: false,
        error: '분석 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: '지원하지 않는 HTTP 메서드입니다.'
  });
} 