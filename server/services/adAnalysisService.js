const OpenAI = require('openai');
const prompts = require('../config/prompts');

let openai = null;

// OpenAI API 키가 있을 때만 초기화
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI API 연결됨');
} else {
  console.log('⚠️  OpenAI API 키가 설정되지 않음. AI 기능이 제한됩니다.');
}

/**
 * 기본 광고 품질 평가 (GPT 미연결 시 사용)
 * @param {Object} ad - 광고 객체
 * @param {string} keyword - 검색 키워드
 * @returns {Object} 평가 결과
 */
function evaluateAdBasic(ad, keyword) {
  const normalizedKeyword = keyword.toLowerCase();
  const normalizedTitle = ad.title ? ad.title.toLowerCase() : '';
  const normalizedDesc = ad.description ? ad.description.toLowerCase() : '';
  
  let score = 0;
  const feedback = [];
  
  // 키워드 포함 여부 (40점)
  if (normalizedTitle.includes(normalizedKeyword)) {
    score += 25;
    feedback.push('제목에 키워드 포함 ✓');
  } else {
    feedback.push('제목에 키워드 미포함 ✗');
  }
  
  if (normalizedDesc.includes(normalizedKeyword)) {
    score += 15;
    feedback.push('설명에 키워드 포함 ✓');
  }
  
  // 제목 길이 적절성 (20점)
  if (ad.title && ad.title.length >= 10 && ad.title.length <= 30) {
    score += 20;
    feedback.push('제목 길이 적절 ✓');
  } else if (!ad.title || ad.title.length < 10) {
    feedback.push('제목이 너무 짧음 ✗');
  } else {
    feedback.push('제목이 너무 김 ✗');
  }
  
  // 설명 존재 여부 (20점)
  if (ad.description && ad.description.length > 10) {
    score += 20;
    feedback.push('상세 설명 존재 ✓');
  } else {
    feedback.push('상세 설명 부족 ✗');
  }
  
  // 강조 표현 사용 (20점)
  const emphasisWords = ['최고', '최대', '할인', '무료', '특가', '이벤트', '신규', '추천'];
  const hasEmphasis = emphasisWords.some(word => 
    normalizedTitle.includes(word) || normalizedDesc.includes(word)
  );
  
  if (hasEmphasis) {
    score += 20;
    feedback.push('강조 표현 사용 ✓');
  } else {
    feedback.push('강조 표현 부족 ✗');
  }
  
  return {
    score: Math.min(score, 100),
    grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
    feedback
  };
}

/**
 * 기본 광고 제안 생성 (AI 실패 시)
 * @param {string} keyword - 검색 키워드
 * @param {string} companyName - 자사명
 * @returns {Array} 기본 광고 제안
 */
function generateDefaultSuggestions(keyword, companyName) {
  return [
    {
      title: `${keyword} 전문 ${companyName}`,
      description: `${keyword} 최고 품질, 합리적 가격으로 만나보세요`,
      improvement: '키워드와 회사명을 직접적으로 연결하여 신뢰성 강조'
    },
    {
      title: `${keyword} 할인 이벤트 진행중`,
      description: `${companyName}에서 특별 할인가로 만나는 ${keyword}`,
      improvement: '할인 혜택을 강조하여 클릭 유도'
    },
    {
      title: `${keyword} 무료 상담 받기`,
      description: `${companyName} 전문가가 직접 상담해드립니다`,
      improvement: '무료 상담으로 진입 장벽을 낮춤'
    },
    {
      title: `${keyword} 1위 ${companyName}`,
      description: `검증된 품질과 서비스로 고객 만족도 1위`,
      improvement: '1위라는 권위를 활용한 신뢰성 어필'
    },
    {
      title: `${keyword} 신규 고객 혜택`,
      description: `${companyName} 첫 구매 시 특별 혜택 제공`,
      improvement: '신규 고객 타겟팅으로 신규 유입 증대'
    }
  ];
}

/**
 * GPT 기반 통합 광고 분석 함수 (이미지 지원)
 * @param {Object} params - 분석 파라미터
 * @returns {Promise<Object>} 분석 결과
 */
async function analyzeAds({ keyword, companyName, adText, imageBuffer }) {
  try {
    console.log('GPT 기반 통합 광고 분석 시작...');
    
    // OpenAI가 연결되지 않은 경우 기본 분석 사용
    if (!openai) {
      console.log('OpenAI 미연결로 기본 분석 수행');
      return await analyzeAdsBasic(keyword, companyName, adText || '이미지 분석 불가');
    }

    // 최신 프롬프트 설정 로드
    delete require.cache[require.resolve('../config/prompts')];
    const currentPrompts = require('../config/prompts');
    
    let messages = [
      {
        role: "system",
        content: currentPrompts.analysisSystem
      }
    ];

    // 이미지가 있는 경우 Vision API 사용
    if (imageBuffer) {
      const base64Image = imageBuffer.toString('base64');
      const imagePrompt = `검색키워드: "${keyword}"
자사명: "${companyName}"

첨부된 이미지는 네이버 검색광고 결과 화면입니다. 이미지를 분석하여 다음 JSON 형식으로 응답해주세요:

{
  "totalAds": [총 광고 수],
  "companyAnalysis": {
    "company": "${companyName}",
    "title": "[자사 광고 제목]",
    "description": "[자사 광고 설명]",
    "url": "[자사 광고 URL]",
    "rank": [자사 광고 순위, 없으면 null],
    "tags": ["태그1", "태그2", "태그3"],
    "evaluation": {
      "score": [0-100점],
      "grade": "[A/B/C/D]",
      "feedback": ["평가 피드백1", "평가 피드백2", ...]
    }
  },
  "competitorAnalysis": [
    {
      "company": "[경쟁사명1]",
      "title": "[광고 제목]",
      "description": "[광고 설명]",
      "url": "[광고 URL]",
      "rank": [순위],
      "tags": ["태그1", "태그2", "태그3"],
      "evaluation": {
        "score": [0-100점],
        "grade": "[A/B/C/D]",
        "feedback": ["평가 피드백1", "평가 피드백2", ...]
      }
    }
  ],
  "adSuggestions": [
    {
      "title": "[제안 광고 제목1]",
      "description": "[제안 광고 설명1]",
      "improvement": "[개선 포인트1]"
    }
  ]
}

분석 기준:
1. 자사 광고가 이미지에 없으면 companyAnalysis를 null로 설정
2. 경쟁사는 상위 5개까지만 분석
3. 광고 평가는 키워드 관련성, 제목 효과성, 설명 완성도, 차별화 요소를 종합
4. 광고 소재 제안은 경쟁사 분석을 바탕으로 차별화된 내용으로 작성
5. tags는 각 광고 하단에 있는 키워드들을 추출
6. 응답은 반드시 유효한 JSON 형식이어야 함`;

      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: imagePrompt
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: "high"
            }
          }
        ]
      });
    } else {
      // 텍스트만 있는 경우 기존 방식 사용
      const prompt = currentPrompts.analysisUser
        .replace('{keyword}', keyword)
        .replace('{companyName}', companyName)
        .replace('{adText}', adText)
        .replace('{companyName}', companyName); // 두 번째 occurrence

      messages.push({
        role: "user",
        content: prompt
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1", // Vision 지원 모델
      messages: messages,
      max_tokens: 3000, // 토큰 수 줄여서 처리 시간 단축
      temperature: 0.1 // 더 일관된 결과를 위해 낮춤
    });

    const analysisResult = parseGPTAnalysisResult(response.choices[0].message.content, keyword, companyName);
    
    return {
      ...analysisResult,
      keyword,
      companyName,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('GPT 광고 분석 오류:', error);
    // GPT 오류 시 기본 분석으로 폴백
    return await analyzeAdsBasic(keyword, companyName, adText || '이미지 분석 불가');
  }
}

/**
 * 기본 광고 분석 (GPT 미연결 시 사용)
 * @param {string} keyword - 검색 키워드
 * @param {string} companyName - 자사명
 * @param {string} adText - 광고 텍스트
 * @returns {Promise<Object>} 분석 결과
 */
async function analyzeAdsBasic(keyword, companyName, adText) {
  try {
    console.log('기본 분석 수행 중...');
    
    // 간단한 기본 분석 결과 반환
    const adSuggestions = generateDefaultSuggestions(keyword, companyName);
    
    return {
      keyword,
      companyName,
      totalAds: 1,
      companyAnalysis: null,
      competitorAnalysis: [],
      adSuggestions,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('기본 광고 분석 오류:', error);
    throw error;
  }
}

/**
 * GPT 분석 결과 파싱
 * @param {string} content - GPT 응답 내용
 * @param {string} keyword - 검색 키워드
 * @param {string} companyName - 자사명
 * @returns {Object} 파싱된 분석 결과
 */
function parseGPTAnalysisResult(content, keyword, companyName) {
  try {
    // JSON 부분만 추출
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON 형식을 찾을 수 없습니다.');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    // 기본값 설정 및 검증
    return {
      totalAds: result.totalAds || 0,
      companyAnalysis: result.companyAnalysis || null,
      competitorAnalysis: Array.isArray(result.competitorAnalysis) ? result.competitorAnalysis : [],
      adSuggestions: Array.isArray(result.adSuggestions) ? result.adSuggestions : generateDefaultSuggestions(keyword, companyName)
    };
    
  } catch (error) {
    console.error('GPT 분석 결과 파싱 오류:', error);
    
    // 파싱 실패 시 기본 구조 반환
    return {
      totalAds: 1,
      companyAnalysis: null,
      competitorAnalysis: [],
      adSuggestions: generateDefaultSuggestions(keyword, companyName)
    };
  }
}

module.exports = {
  analyzeAds
}; 