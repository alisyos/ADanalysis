import React, { useState } from 'react';
import { Trophy, Target, Lightbulb, Star, TrendingUp, Award } from './Icons';
import { AnalysisResult as AnalysisResultType, Ad, AdSuggestion } from '../types';

interface AnalysisResultProps {
  result: AnalysisResultType;
}

type TabType = 'company' | 'competitors' | 'suggestions';

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<TabType>('company');

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'grade-A';
      case 'B': return 'grade-B';
      case 'C': return 'grade-C';
      case 'D': return 'grade-D';
      default: return 'grade-D';
    }
  };

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'A': return <Trophy className="w-5 h-5" />;
      case 'B': return <Award className="w-5 h-5" />;
      case 'C': return <Target className="w-5 h-5" />;
      case 'D': return <TrendingUp className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  const AdCard: React.FC<{ ad: Ad; title: string; isCompany?: boolean }> = ({ ad, title, isCompany = false }) => (
    <div className={`card ${isCompany ? 'border-primary-200 bg-primary-50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">광고 노출순위: {ad.rank}위</span>
          <div className={`flex items-center px-3 py-1 rounded-full border text-sm font-medium ${getGradeColor(ad.evaluation.grade)}`}>
            {getGradeIcon(ad.evaluation.grade)}
            <span className="ml-1">{ad.evaluation.grade}등급</span>
            <span className="ml-2">{ad.evaluation.score}점</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">광고 제목</h4>
          <p className="text-gray-900 font-medium">{ad.title}</p>
        </div>
        
        {ad.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">광고 설명</h4>
            <p className="text-gray-600">{ad.description}</p>
          </div>
        )}
        
        {ad.url && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">URL</h4>
            <p className="text-primary-600 text-sm break-all">{ad.url}</p>
          </div>
        )}
        
        {ad.tags && ad.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">태그</h4>
            <div className="flex flex-wrap gap-2">
              {ad.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">평가 피드백</h4>
          <ul className="space-y-1">
            {ad.evaluation.feedback.map((feedback, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  feedback.includes('✓') ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                {feedback}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const SuggestionCard: React.FC<{ suggestion: AdSuggestion; index: number }> = ({ suggestion, index }) => (
    <div className="card border-yellow-200 bg-yellow-50">
      <div className="flex items-center mb-3">
        <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 text-white rounded-full text-sm font-bold mr-3">
          {index + 1}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">제안 #{index + 1}</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">제목</h4>
          <p className="text-gray-900 font-medium">{suggestion.title}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">설명</h4>
          <p className="text-gray-600">{suggestion.description}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">개선 포인트</h4>
          <p className="text-yellow-800 bg-yellow-100 p-3 rounded-lg text-sm">
            <Lightbulb className="w-4 h-4 inline mr-1" />
            {suggestion.improvement}
          </p>
        </div>
      </div>
    </div>
  );

  const tabs = [
    {
      id: 'company' as TabType,
      label: '자사 광고 분석',
      icon: <Target className="w-5 h-5" />,
      count: result.companyAnalysis ? 1 : 0
    },
    {
      id: 'competitors' as TabType,
      label: '경쟁사 분석',
      icon: <TrendingUp className="w-5 h-5" />,
      count: result.competitorAnalysis.length
    },
    {
      id: 'suggestions' as TabType,
      label: 'AI 광고 소재 제안',
      icon: <Lightbulb className="w-5 h-5" />,
      count: result.adSuggestions.length
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return (
          <div className="animate-fade-in">
            {result.companyAnalysis ? (
              <AdCard ad={result.companyAnalysis} title={result.companyName} isCompany={true} />
            ) : (
              <div className="card border-red-200 bg-red-50">
                <div className="text-center py-8">
                  <div className="text-red-600 mb-2">
                    <Target className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">자사 광고가 검색결과에 없습니다</h3>
                  <p className="text-red-600">
                    '{result.keyword}' 검색 시 {result.companyName}의 광고가 노출되지 않고 있습니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'competitors':
        return (
          <div className="animate-fade-in">
            {result.competitorAnalysis.length > 0 ? (
              <div className="space-y-6">
                {result.competitorAnalysis.map((ad, index) => (
                  <AdCard 
                    key={index} 
                    ad={ad} 
                    title={ad.company || `경쟁사 #${index + 1}`} 
                  />
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="text-center py-8 text-gray-500">
                  경쟁사 광고를 찾을 수 없습니다.
                </div>
              </div>
            )}
          </div>
        );

      case 'suggestions':
        return (
          <div className="animate-fade-in">
            {result.adSuggestions.length > 0 ? (
              <div className="space-y-6">
                {result.adSuggestions.map((suggestion, index) => (
                  <SuggestionCard key={index} suggestion={suggestion} index={index} />
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="text-center py-8 text-gray-500">
                  광고 소재 제안을 생성할 수 없습니다.
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 분석 개요 */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="flex items-center mb-4">
          <Star className="w-6 h-6 text-primary-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">분석 결과</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{result.keyword}</div>
            <div className="text-sm text-gray-600">검색 키워드</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{result.totalAds}개</div>
            <div className="text-sm text-gray-600">총 광고 수</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {result.companyAnalysis ? `${result.companyAnalysis.rank}위` : '미노출'}
            </div>
            <div className="text-sm text-gray-600">{result.companyName} 광고 노출순위</div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>

      {/* 분석 정보 */}
      <div className="card bg-gray-50">
        <div className="text-sm text-gray-500 text-center">
          분석 완료 시간: {new Date(result.timestamp).toLocaleString('ko-KR')}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult; 