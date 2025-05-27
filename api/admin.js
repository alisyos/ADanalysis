const fs = require('fs').promises;
const path = require('path');

const promptsPath = path.join(process.cwd(), 'server/config/prompts.js');

// Vercel API Route 핸들러
export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // 현재 프롬프트 설정 로드
      delete require.cache[require.resolve('../server/config/prompts.js')];
      const prompts = require('../server/config/prompts.js');
      
      return res.json({
        success: true,
        data: prompts
      });
    } catch (error) {
      console.error('프롬프트 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: '프롬프트 조회 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { prompts } = req.body;
      
      if (!prompts || typeof prompts !== 'object') {
        return res.status(400).json({
          success: false,
          error: '유효하지 않은 프롬프트 데이터입니다.'
        });
      }

      // 프롬프트 파일 내용 생성
      const fileContent = `// 시스템 프롬프트 설정
const prompts = {
  // 광고 분석 시스템 프롬프트
  analysisSystem: \`${prompts.analysisSystem || ''}\`,

  // 광고 분석 사용자 프롬프트 템플릿
  analysisUser: \`${prompts.analysisUser || ''}\`
};

module.exports = prompts;`;

      // 파일 저장
      await fs.writeFile(promptsPath, fileContent, 'utf8');
      
      // 캐시 삭제하여 새로운 설정 로드
      delete require.cache[require.resolve('../server/config/prompts.js')];
      
      return res.json({
        success: true,
        message: '프롬프트가 성공적으로 저장되었습니다.'
      });
    } catch (error) {
      console.error('프롬프트 저장 오류:', error);
      return res.status(500).json({
        success: false,
        error: '프롬프트 저장 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const defaultPrompts = {
        analysisSystem: `당신은 한국의 디지털 마케팅 전문가입니다. 네이버 검색광고 분석에 특화되어 있으며, 정확한 JSON 형식으로 분석 결과를 제공합니다.

주요 역할:
1. 네이버 검색광고 텍스트 파싱 및 분석
2. 자사/경쟁사 광고 품질 평가 (키워드 관련성, 제목 효과성, 설명 완성도, 차별화 요소)
3. 태그 키워드 추출 및 분류
4. 효과적인 광고 소재 제안

분석 기준:
- 객관적이고 전문적인 평가 제공
- 한국 시장 특성 반영
- 실용적인 개선 방안 제시`,

        analysisUser: `검색키워드: "{keyword}"
자사명: "{companyName}"

다음은 네이버 검색광고 결과 텍스트입니다:
{adText}

위 텍스트를 분석하여 다음 JSON 형식으로 응답해주세요:

{
  "totalAds": [총 광고 수],
  "companyAnalysis": {
    "company": "{companyName}",
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
5. tags는 각 광고 하단에 있는 키워드들을 추출 (예: "보험료계산", "신규고객", "갱신고객", "이벤트확인", "카드결제혜택" 등)
6. 응답은 반드시 유효한 JSON 형식이어야 함`
      };

      // 기본 프롬프트로 파일 생성
      const fileContent = `// 시스템 프롬프트 설정
const prompts = {
  // 광고 분석 시스템 프롬프트
  analysisSystem: \`${defaultPrompts.analysisSystem}\`,

  // 광고 분석 사용자 프롬프트 템플릿
  analysisUser: \`${defaultPrompts.analysisUser}\`
};

module.exports = prompts;`;

      await fs.writeFile(promptsPath, fileContent, 'utf8');
      
      // 캐시 삭제
      delete require.cache[require.resolve('../server/config/prompts.js')];
      
      return res.json({
        success: true,
        message: '프롬프트가 기본값으로 초기화되었습니다.',
        data: defaultPrompts
      });
    } catch (error) {
      console.error('프롬프트 초기화 오류:', error);
      return res.status(500).json({
        success: false,
        error: '프롬프트 초기화 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: '지원하지 않는 HTTP 메서드입니다.'
  });
} 