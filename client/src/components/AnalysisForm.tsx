import React, { useState, useRef } from 'react';
import { Upload, Search, FileText, Image, AlertCircle } from './Icons';
import { AnalysisRequest } from '../types';

interface AnalysisFormProps {
  onSubmit: (request: AnalysisRequest) => void;
  loading: boolean;
  hasResult?: boolean;
  onNewAnalysis?: () => void;
}

const AnalysisForm: React.FC<AnalysisFormProps> = ({ onSubmit, loading, hasResult, onNewAnalysis }) => {
  const [keyword, setKeyword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [adText, setAdText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<'text' | 'image'>('text');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!keyword.trim()) {
      newErrors.keyword = '검색키워드를 입력해주세요.';
    }

    if (!companyName.trim()) {
      newErrors.companyName = '자사명을 입력해주세요.';
    }

    if (inputType === 'text' && !adText.trim()) {
      newErrors.adText = '광고 텍스트를 입력해주세요.';
    }

    if (inputType === 'image' && !selectedFile) {
      newErrors.image = '이미지 파일을 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const request: AnalysisRequest = {
      keyword: keyword.trim(),
      companyName: companyName.trim(),
    };

    if (inputType === 'text') {
      request.adText = adText.trim();
    } else {
      request.image = selectedFile!;
    }

    onSubmit(request);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, image: '파일 크기는 10MB 이하여야 합니다.' });
        return;
      }

      // 파일 타입 체크
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, image: '지원되는 이미지 형식: JPG, PNG, GIF, BMP' });
        return;
      }

      setSelectedFile(file);
      setErrors({ ...errors, image: '' });
    }
  };

  const handleInputTypeChange = (type: 'text' | 'image') => {
    setInputType(type);
    setErrors({});
    if (type === 'text') {
      setSelectedFile(null);
    } else {
      setAdText('');
    }
  };

  const handleNewAnalysisClick = () => {
    setKeyword('');
    setCompanyName('');
    setAdText('');
    setSelectedFile(null);
    setInputType('text');
    setErrors({});
    if (onNewAnalysis) {
      onNewAnalysis();
    }
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">광고 분석 요청</h2>
        <p className="text-gray-600">
          검색키워드와 자사명을 입력하고, 네이버 검색광고 결과를 텍스트 또는 이미지로 제공해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 입력 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
              검색키워드 *
            </label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={`input-field ${errors.keyword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="예: 온라인 쇼핑몰"
              disabled={loading}
            />
            {errors.keyword && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.keyword}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              자사명 *
            </label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={`input-field ${errors.companyName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="예: ABC쇼핑"
              disabled={loading}
            />
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.companyName}
              </p>
            )}
          </div>
        </div>

        {/* 입력 방식 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            광고 데이터 입력 방식 *
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleInputTypeChange('text')}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                inputType === 'text'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              <FileText className="w-4 h-4 mr-2" />
              텍스트 입력
            </button>
            <button
              type="button"
              onClick={() => handleInputTypeChange('image')}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                inputType === 'image'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              <Image className="w-4 h-4 mr-2" />
              이미지 업로드
            </button>
          </div>
        </div>

        {/* 텍스트 입력 */}
        {inputType === 'text' && (
          <div>
            <label htmlFor="adText" className="block text-sm font-medium text-gray-700 mb-2">
              광고 텍스트 *
            </label>
            <textarea
              id="adText"
              value={adText}
              onChange={(e) => setAdText(e.target.value)}
              rows={8}
              className={`input-field ${errors.adText ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="네이버 검색광고 영역의 텍스트를 복사해서 붙여넣어주세요..."
              disabled={loading}
            />
            {errors.adText && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.adText}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              네이버에서 검색 후 광고 영역의 텍스트를 복사해서 붙여넣어주세요.
            </p>
          </div>
        )}

        {/* 이미지 업로드 */}
        {inputType === 'image' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              광고 이미지 *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                errors.image
                  ? 'border-red-300 bg-red-50'
                  : selectedFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <Image className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-primary-600 hover:text-primary-700"
                    disabled={loading}
                  >
                    다른 파일 선택
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    disabled={loading}
                  >
                    이미지 파일 선택
                  </button>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, GIF, BMP (최대 10MB)
                  </p>
                </div>
              )}
            </div>
            {errors.image && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.image}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              네이버 검색광고 영역을 캡처한 이미지를 업로드해주세요.
            </p>
          </div>
        )}

        {/* 제출 버튼 */}
        <div className="flex justify-between items-center">
          {hasResult && onNewAnalysis && (
            <button
              type="button"
              onClick={handleNewAnalysisClick}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              새 분석
            </button>
          )}
          
          <div className={hasResult ? '' : 'ml-auto'}>
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary flex items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  분석 중...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  {hasResult ? '재분석' : '분석 시작'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AnalysisForm; 