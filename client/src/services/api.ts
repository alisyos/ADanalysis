import axios from 'axios';
import { AnalysisRequest, AnalysisResult, ApiResponse } from '../types';

// Vercel 배포 환경을 고려한 API URL 설정
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' // 프로덕션에서는 Vercel API Routes 사용
  : (process.env.REACT_APP_API_URL || 'http://localhost:3001');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120초 타임아웃 (GPT Vision 처리 시간 고려)
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log('API 요청:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log('API 응답:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API 응답 오류:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

/**
 * 광고 분석 요청
 * @param request 분석 요청 데이터
 * @returns 분석 결과
 */
export const analyzeAds = async (request: AnalysisRequest): Promise<AnalysisResult> => {
  try {
    const formData = new FormData();
    formData.append('keyword', request.keyword);
    formData.append('companyName', request.companyName);
    
    if (request.adText) {
      formData.append('adText', request.adText);
    }
    
    if (request.image) {
      formData.append('image', request.image);
    }

    if (request.additionalInfo) {
      formData.append('additionalInfo', request.additionalInfo);
    }

    // 환경에 따라 다른 엔드포인트 사용
    const endpoint = process.env.NODE_ENV === 'production' 
      ? '/analysis' 
      : '/api/analysis/analyze';

    const response = await api.post<ApiResponse<AnalysisResult>>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '분석 결과를 받을 수 없습니다.');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('광고 분석 오류:', error);
    
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
    }
    
    throw new Error('광고 분석 중 오류가 발생했습니다.');
  }
};

/**
 * 서버 상태 확인
 * @returns 서버 상태
 */
export const checkServerStatus = async (): Promise<any> => {
  try {
    // 환경에 따라 다른 엔드포인트 사용
    const endpoint = process.env.NODE_ENV === 'production' 
      ? '/analysis' 
      : '/api/analysis/status';
      
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('서버 상태 확인 오류:', error);
    throw new Error('서버에 연결할 수 없습니다.');
  }
};

/**
 * 헬스 체크
 * @returns 헬스 체크 결과
 */
export const healthCheck = async (): Promise<any> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('헬스 체크 오류:', error);
    throw new Error('서버 헬스 체크 실패');
  }
};

export default api; 