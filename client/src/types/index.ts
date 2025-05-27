export interface AdEvaluation {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  feedback: string[];
}

export interface Ad {
  title: string;
  description: string;
  url: string;
  company: string;
  rank: number;
  evaluation: AdEvaluation;
}

export interface AdSuggestion {
  title: string;
  description: string;
  improvement: string;
}

export interface AnalysisResult {
  keyword: string;
  companyName: string;
  totalAds: number;
  companyAnalysis: Ad | null;
  competitorAnalysis: Ad[];
  adSuggestions: AdSuggestion[];
  timestamp: string;
}

export interface AnalysisRequest {
  keyword: string;
  companyName: string;
  adText?: string;
  image?: File;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  processedText?: string;
} 