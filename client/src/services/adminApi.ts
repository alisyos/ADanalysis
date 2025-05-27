import axios from 'axios';

// Vercel 배포 환경을 고려한 API URL 설정
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' // 프로덕션에서는 Vercel API Routes 사용
  : (process.env.REACT_APP_API_URL || 'http://localhost:3001');

export interface Prompts {
  analysisSystem: string;
  analysisUser: string;
}

export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  message?: string;
}

// 프롬프트 조회
export const getPrompts = async (): Promise<AdminApiResponse<Prompts>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin`);
    return response.data;
  } catch (error: any) {
    console.error('프롬프트 조회 오류:', error);
    return {
      success: false,
      error: error.response?.data?.error || '프롬프트 조회 중 오류가 발생했습니다.'
    };
  }
};

// 프롬프트 저장
export const savePrompts = async (prompts: Prompts): Promise<AdminApiResponse<void>> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/admin`, { prompts });
    return response.data;
  } catch (error: any) {
    console.error('프롬프트 저장 오류:', error);
    return {
      success: false,
      error: error.response?.data?.error || '프롬프트 저장 중 오류가 발생했습니다.'
    };
  }
};

// 프롬프트 초기화
export const resetPrompts = async (): Promise<AdminApiResponse<Prompts>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin`);
    return response.data;
  } catch (error: any) {
    console.error('프롬프트 초기화 오류:', error);
    return {
      success: false,
      error: error.response?.data?.error || '프롬프트 초기화 중 오류가 발생했습니다.'
    };
  }
}; 