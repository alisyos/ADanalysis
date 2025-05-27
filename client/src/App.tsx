import React, { useState } from 'react';
import { BarChart3, AlertTriangle } from './components/Icons';
import AnalysisForm from './components/AnalysisForm';
import AnalysisResult from './components/AnalysisResult';
import AdminPage from './components/AdminPage';
import { analyzeAds } from './services/api';
import { AnalysisRequest, AnalysisResult as AnalysisResultType } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<'analysis' | 'admin'>('analysis');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisSubmit = async (request: AnalysisRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('분석 요청 시작:', request);
      const analysisResult = await analyzeAds(request);
      console.log('분석 완료:', analysisResult);
      setResult(analysisResult);
    } catch (err: any) {
      console.error('분석 오류:', err);
      setError(err.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">검색광고 경쟁력 분석 시스템</h1>
                <p className="text-sm text-gray-500">AI 기반 광고 분석 및 소재 제안</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage('analysis')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'analysis'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                광고 분석
              </button>
              <button
                onClick={() => setCurrentPage('admin')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                관리자
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      {currentPage === 'analysis' ? (
        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 에러 메시지 */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 좌우 분할 레이아웃 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 min-h-[calc(100vh-200px)]">
            {/* 좌측: 입력 폼 */}
            <div className="overflow-y-auto">
              <AnalysisForm 
                onSubmit={handleAnalysisSubmit} 
                loading={loading} 
                hasResult={!!result}
                onNewAnalysis={handleNewAnalysis}
              />
            </div>

            {/* 우측: 결과 출력 */}
            <div className="overflow-y-auto">
              {result ? (
                <AnalysisResult result={result} />
              ) : (
                <div className="card h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">분석 결과 대기 중</h3>
                    <p className="text-sm">
                      좌측에서 검색키워드와 광고 데이터를 입력하고<br />
                      분석을 시작하면 여기에 결과가 표시됩니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 로딩 오버레이 */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">광고 분석 중...</h3>
                  <p className="text-gray-600 text-sm">
                    AI가 광고를 분석하고 개선안을 생성하고 있습니다.<br />
                    잠시만 기다려주세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : (
        <AdminPage />
      )}

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 검색광고 경쟁력 분석 시스템. AI 기반 광고 분석 서비스.</p>
            <p className="mt-2">
              네이버 검색광고 데이터를 분석하여 경쟁력 있는 광고 소재를 제안합니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 