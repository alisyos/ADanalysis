const Tesseract = require('tesseract.js');

/**
 * 이미지 버퍼에서 텍스트를 추출하는 OCR 서비스 (Vercel 환경 최적화)
 * @param {Buffer} imageBuffer - 이미지 파일 버퍼
 * @returns {Promise<string>} 추출된 텍스트
 */
async function extractTextFromImage(imageBuffer) {
  try {
    console.log('OCR 처리 시작 (버퍼 크기:', imageBuffer.length, 'bytes)');
    
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'kor+eng', // 한국어 + 영어 인식
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR 진행률: ${Math.round(m.progress * 100)}%`);
          }
        },
        // Vercel 환경 최적화 설정
        corePath: 'https://unpkg.com/tesseract.js-core@2.2.0/tesseract-core.wasm.js',
        workerPath: 'https://unpkg.com/tesseract.js@2.1.5/dist/worker.min.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0'
      }
    );

    // 텍스트 정제
    const cleanedText = text
      .replace(/\n+/g, '\n') // 연속된 줄바꿈 정리
      .replace(/\s+/g, ' ') // 연속된 공백 정리
      .trim();

    console.log('OCR 완료. 추출된 텍스트 길이:', cleanedText.length);
    
    return cleanedText;
  } catch (error) {
    console.error('OCR 처리 오류:', error);
    throw new Error(`OCR 처리 실패: ${error.message}`);
  }
}

/**
 * 이미지에서 텍스트를 추출하는 OCR 서비스 (기존 로컬 환경용)
 * @param {string} imagePath - 이미지 파일 경로
 * @returns {Promise<string>} 추출된 텍스트
 */
async function processImage(imagePath) {
  try {
    console.log('OCR 처리 시작:', imagePath);
    
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'kor+eng', // 한국어 + 영어 인식
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR 진행률: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    // 텍스트 정제
    const cleanedText = text
      .replace(/\n+/g, '\n') // 연속된 줄바꿈 정리
      .replace(/\s+/g, ' ') // 연속된 공백 정리
      .trim();

    console.log('OCR 완료. 추출된 텍스트 길이:', cleanedText.length);
    
    return cleanedText;
  } catch (error) {
    console.error('OCR 처리 오류:', error);
    throw new Error(`OCR 처리 실패: ${error.message}`);
  }
}

/**
 * 텍스트에서 광고 관련 정보를 추출
 * @param {string} text - OCR로 추출된 텍스트
 * @returns {Object} 구조화된 광고 정보
 */
function extractAdInfo(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  const ads = [];
  let currentAd = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 광고 제목으로 보이는 패턴 (일반적으로 더 긴 텍스트)
    if (trimmedLine.length > 10 && !trimmedLine.includes('http')) {
      if (currentAd) {
        ads.push(currentAd);
      }
      currentAd = {
        title: trimmedLine,
        description: '',
        url: ''
      };
    }
    // URL 패턴
    else if (trimmedLine.includes('.') && (trimmedLine.includes('www') || trimmedLine.includes('http'))) {
      if (currentAd) {
        currentAd.url = trimmedLine;
      }
    }
    // 설명으로 보이는 텍스트
    else if (currentAd && trimmedLine.length > 5) {
      currentAd.description += (currentAd.description ? ' ' : '') + trimmedLine;
    }
  }
  
  if (currentAd) {
    ads.push(currentAd);
  }
  
  return {
    rawText: text,
    extractedAds: ads,
    totalAds: ads.length
  };
}

module.exports = {
  extractTextFromImage,
  processImage,
  extractAdInfo
}; 