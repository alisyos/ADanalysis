const OpenAI = require('openai');
const { extractAdInfo } = require('./ocrService');

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
 * 네이버 검색광고 텍스트에서 개별 광고를 파싱
 * @param {string} adText - 광고 텍스트
 * @returns {Array} 파싱된 광고 배열
 */
function parseAds(adText) {
  const lines = adText.split('\n').filter(line => line.trim().length > 0);
  const ads = [];
  let currentAd = null;
  let isInAdBlock = false;
  let expectingTitle = false;
  let expectingDescription = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 광고 블록 시작 감지 (회사명 패턴)
    if (line.includes('화재') || line.includes('손해보험') || line.includes('다이렉트') || 
        line.includes('.co.kr') || line.includes('.com') || line.includes('direct.')) {
      
      // 이전 광고 저장
      if (currentAd && currentAd.title) {
        ads.push(currentAd);
      }
      
      // 새 광고 시작
      currentAd = {
        title: '',
        description: '',
        url: '',
        company: '',
        tags: []
      };
      
      // URL인지 회사명인지 판단
      if (line.includes('.')) {
        currentAd.url = line;
        // URL에서 회사명 추출
        const domain = line.replace(/https?:\/\//, '').replace(/www\./, '').split('/')[0];
        const companyPart = domain.split('.')[0];
        currentAd.company = extractCompanyName(companyPart);
      } else {
        currentAd.company = line;
      }
      
      isInAdBlock = true;
      expectingTitle = true;
      continue;
    }
    
    // URL 패턴 감지
    if (line.includes('.co.kr') || line.includes('.com') || line.includes('direct.')) {
      if (currentAd && !currentAd.url) {
        currentAd.url = line;
        if (!currentAd.company) {
          const domain = line.replace(/https?:\/\//, '').replace(/www\./, '').split('/')[0];
          const companyPart = domain.split('.')[0];
          currentAd.company = extractCompanyName(companyPart);
        }
      }
      expectingTitle = true;
      continue;
    }
    
    // 광고 제목 감지 (긴 텍스트이면서 광고성 내용)
    if (expectingTitle && isInAdBlock && line.length > 15 && 
        (line.includes('자동차보험') || line.includes('보험') || line.includes('가입') || 
         line.includes('할인') || line.includes('혜택'))) {
      if (currentAd) {
        currentAd.title = line;
        expectingTitle = false;
        expectingDescription = true;
      }
      continue;
    }
    
    // 광고 설명 감지 (제목 다음의 긴 설명문)
    if (expectingDescription && isInAdBlock && line.length > 20 && 
        !isTagLine(line) && !isNavigationLine(line)) {
      if (currentAd) {
        currentAd.description = line;
        expectingDescription = false;
      }
      continue;
    }
    
    // 태그 라인 감지 (짧은 키워드들)
    if (isInAdBlock && isTagLine(line)) {
      if (currentAd) {
        currentAd.tags.push(line);
      }
      continue;
    }
    
    // 새로운 광고 블록 시작 감지를 위한 리셋
    if (line === '광고' || line === 'favicon' || line === '링크이미지') {
      // 다음 광고 준비
      isInAdBlock = false;
      expectingTitle = false;
      expectingDescription = false;
    }
  }
  
  // 마지막 광고 저장
  if (currentAd && currentAd.title) {
    ads.push(currentAd);
  }
  
  // 빈 광고 제거 및 정리
  return ads.filter(ad => ad.title && ad.title.length > 10);
}

/**
 * 회사명 추출 및 정리
 * @param {string} companyPart - URL에서 추출한 회사 부분
 * @returns {string} 정리된 회사명
 */
function extractCompanyName(companyPart) {
  const companyMap = {
    'samsungfire': '삼성화재다이렉트',
    'direct': '다이렉트',
    'meritzfire': '메리츠화재',
    'carrotins': '캐롯손해보험',
    'eyoudirect': '흥국화재다이렉트',
    'axa': 'AXA손해보험',
    'axakorea': 'AXA손해보험',
    'directdb': 'DB손해보험다이렉트',
    'hi': '현대해상다이렉트',
    'kbinsure': 'KB손해보험다이렉트',
    'kbcarinsure': 'KB손해보험다이렉트'
  };
  
  return companyMap[companyPart] || companyPart;
}

/**
 * 태그 라인인지 판단
 * @param {string} line - 검사할 라인
 * @returns {boolean} 태그 라인 여부
 */
function isTagLine(line) {
  const tagKeywords = ['신규', '갱신', '가입', '보험료', '할인', '혜택', '계산', '확인', '이벤트', '특약'];
  return line.length < 15 && tagKeywords.some(keyword => line.includes(keyword));
}

/**
 * 네비게이션 라인인지 판단
 * @param {string} line - 검사할 라인
 * @returns {boolean} 네비게이션 라인 여부
 */
function isNavigationLine(line) {
  const navKeywords = ['파워링크', '관련 광고', '등록 안내', '링크이미지', 'favicon', '광고', '네이버페이'];
  return navKeywords.some(keyword => line.includes(keyword));
}

/**
 * 자사 광고 찾기
 * @param {Array} ads - 광고 배열
 * @param {string} companyName - 자사명
 * @returns {Object|null} 자사 광고
 */
function findCompanyAd(ads, companyName) {
  const normalizedCompanyName = companyName.toLowerCase().replace(/\s+/g, '');
  
  return ads.find(ad => {
    const normalizedTitle = ad.title.toLowerCase().replace(/\s+/g, '');
    const normalizedDesc = ad.description.toLowerCase().replace(/\s+/g, '');
    const normalizedCompany = ad.company.toLowerCase().replace(/\s+/g, '');
    
    return normalizedTitle.includes(normalizedCompanyName) ||
           normalizedDesc.includes(normalizedCompanyName) ||
           normalizedCompany.includes(normalizedCompanyName);
  });
}

/**
 * GPT 기반 광고 품질 평가
 * @param {Object} ad - 광고 객체
 * @param {string} keyword - 검색 키워드
 * @param {boolean} isCompany - 자사 광고 여부
 * @returns {Promise<Object>} 평가 결과
 */
async function evaluateAdWithGPT(ad, keyword, isCompany = false) {
  try {
    // OpenAI가 연결되지 않은 경우 기본 평가 사용
    if (!openai) {
      return evaluateAdBasic(ad, keyword);
    }

    const adType = isCompany ? '자사' : '경쟁사';
    const prompt = `
검색키워드: "${keyword}"
${adType} 광고 분석:

제목: "${ad.title}"
설명: "${ad.description}"
URL: "${ad.url}"

위 광고를 다음 기준으로 전문적으로 평가해주세요:

1. 키워드 관련성 (25점): 검색키워드와의 연관성
2. 제목 효과성 (25점): 클릭을 유도하는 제목의 매력도
3. 설명 완성도 (25점): 상세 설명의 충실성과 설득력
4. 차별화 요소 (25점): 경쟁사 대비 독특함과 강점

다음 형식으로 응답해주세요:

점수: [총점]/100
등급: [A/B/C/D]
키워드관련성: [점수]/25 - [평가내용]
제목효과성: [점수]/25 - [평가내용]
설명완성도: [점수]/25 - [평가내용]
차별화요소: [점수]/25 - [평가내용]
종합평가: [전체적인 평가와 개선점]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: "당신은 한국의 디지털 마케팅 전문가입니다. 네이버 검색광고 분석에 특화되어 있으며, 객관적이고 전문적인 평가를 제공합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const evaluation = parseGPTEvaluation(response.choices[0].message.content);
    return evaluation;

  } catch (error) {
    console.error('GPT 광고 평가 오류:', error);
    // GPT 오류 시 기본 평가로 폴백
    return evaluateAdBasic(ad, keyword);
  }
}

/**
 * 기본 광고 품질 평가 (GPT 미연결 시 사용)
 * @param {Object} ad - 광고 객체
 * @param {string} keyword - 검색 키워드
 * @returns {Object} 평가 결과
 */
function evaluateAdBasic(ad, keyword) {
  const normalizedKeyword = keyword.toLowerCase();
  const normalizedTitle = ad.title.toLowerCase();
  const normalizedDesc = ad.description.toLowerCase();
  
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
  if (ad.title.length >= 10 && ad.title.length <= 30) {
    score += 20;
    feedback.push('제목 길이 적절 ✓');
  } else if (ad.title.length < 10) {
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
 * GPT 평가 응답 파싱
 * @param {string} content - GPT 응답 내용
 * @returns {Object} 파싱된 평가 결과
 */
function parseGPTEvaluation(content) {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    let score = 70; // 기본값
    let grade = 'B';
    const feedback = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('점수:')) {
        const scoreMatch = trimmed.match(/(\d+)/);
        if (scoreMatch) {
          score = parseInt(scoreMatch[1]);
        }
      } else if (trimmed.startsWith('등급:')) {
        const gradeMatch = trimmed.match(/([ABCD])/);
        if (gradeMatch) {
          grade = gradeMatch[1];
        }
      } else if (trimmed.includes(':') && trimmed.includes('-')) {
        feedback.push(trimmed);
      } else if (trimmed.startsWith('종합평가:')) {
        feedback.push(trimmed);
      }
    }

    return {
      score: Math.min(Math.max(score, 0), 100),
      grade: ['A', 'B', 'C', 'D'].includes(grade) ? grade : 'B',
      feedback: feedback.length > 0 ? feedback : ['GPT 기반 전문 분석 완료']
    };
  } catch (error) {
    console.error('GPT 평가 파싱 오류:', error);
    return {
      score: 70,
      grade: 'B',
      feedback: ['GPT 분석 중 오류 발생, 기본 평가 적용']
    };
  }
}

/**
 * AI 기반 광고 소재 생성
 * @param {string} keyword - 검색 키워드
 * @param {string} companyName - 자사명
 * @param {Array} competitorAds - 경쟁사 광고
 * @param {Object} companyAd - 자사 광고 (있는 경우)
 * @returns {Promise<Array>} 광고 소재 제안
 */
async function generateAdSuggestions(keyword, companyName, competitorAds, companyAd) {
  try {
    // OpenAI가 초기화되지 않은 경우 기본 제안 반환
    if (!openai) {
      console.log('OpenAI 미연결로 기본 광고 제안 생성');
      return generateDefaultSuggestions(keyword, companyName);
    }

    const competitorAnalysis = competitorAds.slice(0, 5).map(ad => 
      `제목: ${ad.title}\n설명: ${ad.description}`
    ).join('\n\n');
    
    const currentAdInfo = companyAd ? 
      `현재 자사 광고:\n제목: ${companyAd.title}\n설명: ${companyAd.description}\n\n` : 
      '현재 자사 광고가 검색결과에 없습니다.\n\n';

    const prompt = `
검색키워드: "${keyword}"
자사명: "${companyName}"

${currentAdInfo}

주요 경쟁사 광고:
${competitorAnalysis}

위 정보를 바탕으로 효과적인 검색광고 소재 5개를 제안해주세요.
각 광고는 다음 형식으로 작성해주세요:

1. 제목: (30자 이내)
   설명: (45자 이내)
   개선포인트: (왜 이 광고가 효과적인지 또는 기존 문제점을 어떻게 개선했는지)

2. 제목: (30자 이내)
   설명: (45자 이내)
   개선포인트: (왜 이 광고가 효과적인지 또는 기존 문제점을 어떻게 개선했는지)

... (5개까지)

요구사항:
- 검색키워드를 자연스럽게 포함
- 경쟁사 대비 차별화 포인트 강조
- 클릭을 유도하는 강력한 카피
- 한국어 검색광고 특성 반영
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: "당신은 한국의 디지털 마케팅 전문가입니다. 네이버 검색광고에 특화된 효과적인 광고 카피를 작성하는 것이 전문입니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const suggestions = parseAdSuggestions(response.choices[0].message.content);
    return suggestions;

  } catch (error) {
    console.error('AI 광고 생성 오류:', error);
    // 기본 제안 반환
    return generateDefaultSuggestions(keyword, companyName);
  }
}

/**
 * AI 응답에서 광고 제안 파싱
 * @param {string} content - AI 응답 내용
 * @returns {Array} 파싱된 광고 제안
 */
function parseAdSuggestions(content) {
  const suggestions = [];
  const sections = content.split(/\d+\.\s/).filter(section => section.trim());
  
  for (const section of sections) {
    const lines = section.split('\n').filter(line => line.trim());
    let title = '', description = '', improvement = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('제목:')) {
        title = trimmed.replace('제목:', '').trim();
      } else if (trimmed.startsWith('설명:')) {
        description = trimmed.replace('설명:', '').trim();
      } else if (trimmed.startsWith('개선포인트:')) {
        improvement = trimmed.replace('개선포인트:', '').trim();
      }
    }
    
    if (title && description) {
      suggestions.push({ title, description, improvement });
    }
  }
  
  return suggestions.slice(0, 5);
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
 * GPT 기반 통합 광고 분석 함수
 * @param {Object} params - 분석 파라미터
 * @returns {Promise<Object>} 분석 결과
 */
async function analyzeAds({ keyword, companyName, adText }) {
  try {
    console.log('GPT 기반 통합 광고 분석 시작...');
    
    // OpenAI가 연결되지 않은 경우 기본 분석 사용
    if (!openai) {
      console.log('OpenAI 미연결로 기본 분석 수행');
      return await analyzeAdsBasic(keyword, companyName, adText);
    }

    const prompt = `
검색키워드: "${keyword}"
자사명: "${companyName}"

다음은 네이버 검색광고 결과 텍스트입니다:
${adText}

위 텍스트를 분석하여 다음 JSON 형식으로 응답해주세요:

{
  "totalAds": [총 광고 수],
  "companyAnalysis": {
    "company": "${companyName}",
    "title": "[자사 광고 제목]",
    "description": "[자사 광고 설명]",
    "url": "[자사 광고 URL]",
    "rank": [자사 광고 순위, 없으면 null],
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
      "evaluation": {
        "score": [0-100점],
        "grade": "[A/B/C/D]",
        "feedback": ["평가 피드백1", "평가 피드백2", ...]
      }
    }
    // ... 최대 5개 경쟁사
  ],
  "adSuggestions": [
    {
      "title": "[제안 광고 제목1]",
      "description": "[제안 광고 설명1]",
      "improvement": "[개선 포인트1]"
    }
    // ... 5개 제안
  ]
}

분석 기준:
1. 자사 광고가 텍스트에 없으면 companyAnalysis를 null로 설정
2. 경쟁사는 상위 5개까지만 분석
3. 광고 평가는 키워드 관련성, 제목 효과성, 설명 완성도, 차별화 요소를 종합
4. 광고 소재 제안은 경쟁사 분석을 바탕으로 차별화된 내용으로 작성
5. 응답은 반드시 유효한 JSON 형식이어야 함
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: "당신은 한국의 디지털 마케팅 전문가입니다. 네이버 검색광고 분석에 특화되어 있으며, 정확한 JSON 형식으로 분석 결과를 제공합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3
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
    return await analyzeAdsBasic(keyword, companyName, adText);
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
    // 기존 파싱 로직 사용
    const ads = parseAds(adText);
    console.log(`기본 분석: 파싱된 광고 수: ${ads.length}`);
    
    const companyAd = findCompanyAd(ads, companyName);
    const companyRank = companyAd ? ads.indexOf(companyAd) + 1 : null;
    const competitorAds = ads.filter(ad => ad !== companyAd).slice(0, 5);
    
    const companyAnalysis = companyAd ? {
      ...companyAd,
      rank: companyRank,
      evaluation: evaluateAdBasic(companyAd, keyword)
    } : null;
    
    const competitorAnalysis = competitorAds.map((ad, index) => ({
      ...ad,
      rank: ads.indexOf(ad) + 1,
      evaluation: evaluateAdBasic(ad, keyword)
    }));
    
    const adSuggestions = generateDefaultSuggestions(keyword, companyName);
    
    return {
      keyword,
      companyName,
      totalAds: ads.length,
      companyAnalysis,
      competitorAnalysis,
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
  analyzeAds,
  analyzeAdsBasic,
  parseAds,
  findCompanyAd,
  evaluateAdWithGPT,
  evaluateAdBasic,
  generateAdSuggestions,
  parseGPTEvaluation,
  parseGPTAnalysisResult,
  extractCompanyName,
  isTagLine,
  isNavigationLine
}; 