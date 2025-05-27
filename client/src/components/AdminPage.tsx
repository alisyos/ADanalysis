import React, { useState, useEffect } from 'react';
import { getPrompts, savePrompts, resetPrompts, Prompts } from '../services/adminApi';

const AdminPage: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompts>({
    analysisSystem: '',
    analysisUser: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const response = await getPrompts();
      if (response.success && response.data) {
        setPrompts(response.data);
        setHasChanges(false);
      } else {
        setMessage({ type: 'error', text: response.error || '프롬프트 로드 실패' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '프롬프트 로드 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await savePrompts(prompts);
      if (response.success) {
        setMessage({ type: 'success', text: response.message || '프롬프트가 저장되었습니다.' });
        setHasChanges(false);
      } else {
        setMessage({ type: 'error', text: response.error || '저장 실패' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('프롬프트를 기본값으로 초기화하시겠습니까? 현재 변경사항은 모두 사라집니다.')) {
      return;
    }

    setSaving(true);
    try {
      const response = await resetPrompts();
      if (response.success && response.data) {
        setPrompts(response.data);
        setMessage({ type: 'success', text: response.message || '프롬프트가 초기화되었습니다.' });
        setHasChanges(false);
      } else {
        setMessage({ type: 'error', text: response.error || '초기화 실패' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '초기화 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePromptChange = (key: keyof Prompts, value: string) => {
    setPrompts(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">프롬프트 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">시스템 프롬프트 관리</h1>
              <p className="text-gray-600 mt-1">GPT 분석 품질 향상을 위한 프롬프트를 관리합니다.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                기본값으로 초기화
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  '변경사항 저장'
                )}
              </button>
            </div>
          </div>
          
          {/* 상태 메시지 */}
          {message && (
            <div className={`mt-4 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
          
          {hasChanges && (
            <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md">
              변경사항이 있습니다. 저장하지 않으면 변경사항이 사라집니다.
            </div>
          )}
        </div>

        {/* 프롬프트 편집 영역 */}
        <div className="space-y-6">
          {/* 시스템 프롬프트 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">시스템 프롬프트</h2>
              <p className="text-sm text-gray-600 mt-1">
                GPT의 역할과 행동 방식을 정의하는 기본 프롬프트입니다.
              </p>
            </div>
            <textarea
              value={prompts.analysisSystem}
              onChange={(e) => handlePromptChange('analysisSystem', e.target.value)}
              className="w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="시스템 프롬프트를 입력하세요..."
            />
            <div className="mt-2 text-sm text-gray-500">
              글자 수: {prompts.analysisSystem.length}
            </div>
          </div>

          {/* 사용자 프롬프트 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">사용자 프롬프트 템플릿</h2>
              <p className="text-sm text-gray-600 mt-1">
                실제 분석 요청 시 사용되는 프롬프트 템플릿입니다. 
                <code className="bg-gray-100 px-1 rounded">{'{keyword}'}</code>, 
                <code className="bg-gray-100 px-1 rounded">{'{companyName}'}</code>, 
                <code className="bg-gray-100 px-1 rounded">{'{adText}'}</code> 변수를 사용할 수 있습니다.
              </p>
            </div>
            <textarea
              value={prompts.analysisUser}
              onChange={(e) => handlePromptChange('analysisUser', e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="사용자 프롬프트 템플릿을 입력하세요..."
            />
            <div className="mt-2 text-sm text-gray-500">
              글자 수: {prompts.analysisUser.length}
            </div>
          </div>
        </div>

        {/* 도움말 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">프롬프트 작성 가이드</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>시스템 프롬프트:</strong> GPT의 역할, 전문성, 응답 스타일을 정의합니다.</p>
            <p><strong>사용자 프롬프트:</strong> 구체적인 작업 지시와 출력 형식을 정의합니다.</p>
            <p><strong>변수 사용:</strong> {'{keyword}'}, {'{companyName}'}, {'{adText}'}는 실행 시 실제 값으로 치환됩니다.</p>
            <p><strong>JSON 형식:</strong> 응답 형식을 명확히 지정하여 파싱 오류를 방지합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 