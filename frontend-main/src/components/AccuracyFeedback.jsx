import React, { useState } from 'react';

const AccuracyFeedback = ({ aiResult, onFeedbackSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [actualWidth, setActualWidth] = useState('');
  const [actualDepth, setActualDepth] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actualWidth || !actualDepth) return;

    setIsSubmitting(true);
    
    const width_error = Math.abs((parseFloat(actualWidth) - aiResult.width_m) / aiResult.width_m * 100);
    const depth_error = Math.abs((parseFloat(actualDepth) - aiResult.depth_m) / aiResult.depth_m * 100);
    const average_error = (width_error + depth_error) / 2;
    
    const feedbackData = {
      ai_measurement: {
        width_m: aiResult.width_m,
        depth_m: aiResult.depth_m,
        confidence: aiResult.confidence,
        quality_score: aiResult.quality?.quality_score
      },
      actual_measurement: {
        width_m: parseFloat(actualWidth),
        depth_m: parseFloat(actualDepth)
      },
      errors: {
        width_error: width_error.toFixed(1),
        depth_error: depth_error.toFixed(1),
        average_error: average_error.toFixed(1)
      },
      user_feedback: feedback,
      timestamp: new Date().toISOString()
    };

    try {
      // TODO: API 엔드포인트 구현 후 실제 전송
      console.log('사용자 피드백 데이터:', feedbackData);
      
      if (onFeedbackSubmit) {
        onFeedbackSubmit(feedbackData);
      }
      
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
      }, 2000);
      
    } catch (error) {
      console.error('피드백 전송 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!aiResult) return null;

  return (
    <div className="mt-4">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full p-3 text-sm bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          📏 실제로 측정해보셨나요? 정확도 개선에 도움을 주세요!
        </button>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900">측정 정확도 피드백</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>AI 측정 결과:</strong>
            </p>
            <p className="text-sm text-blue-700">
              가로 {aiResult.width_m}m × 세로 {aiResult.depth_m}m
            </p>
            <p className="text-xs text-blue-600 mt-1">
              측정 품질: {aiResult.quality?.quality_score || 'N/A'}점 ({aiResult.quality?.grade || 'N/A'})
            </p>
            <p className="text-xs text-blue-500 mt-1">
              예상 오차: {aiResult.quality?.expected_error_range || 'N/A'}
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-4">
              <div className="text-green-600 font-medium mb-2">
                ✅ 피드백이 전송되었습니다!
              </div>
              <p className="text-sm text-gray-600">
                AI 정확도 개선에 도움을 주셔서 감사합니다.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    실제 가로 길이 (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="20"
                    value={actualWidth}
                    onChange={(e) => setActualWidth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="3.2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    실제 세로 길이 (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="20"
                    value={actualDepth}
                    onChange={(e) => setActualDepth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="4.1"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  추가 의견 (선택사항)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="조명이 어두워서 측정이 어려웠어요..."
                  rows="2"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !actualWidth || !actualDepth}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '전송 중...' : '피드백 전송'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  나중에
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                💡 실제 측정값은 AI 정확도 개선에만 사용되며, 개인정보와 연결되지 않습니다.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default AccuracyFeedback;