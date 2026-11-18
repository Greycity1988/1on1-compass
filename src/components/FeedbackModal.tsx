import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { FEEDBACK_ISSUES_URL } from '../constants/links';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Feedback goes to a public GitHub issue: this opens the "new issue" page with the text filled
 * in, and the person posts it there (nothing is sent from this app).
 */
export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = content.trim();
    if (!body) return;
    const firstLine = body.split('\n')[0].slice(0, 60);
    const title = encodeURIComponent(`[Feedback] ${firstLine}`);
    const issueBody = encodeURIComponent(`${body}\n\n---\n서비스: 1on1 Compass`);
    window.open(`${FEEDBACK_ISSUES_URL}?title=${title}&body=${issueBody}`, '_blank', 'noopener,noreferrer');
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="피드백 및 기능 제안"
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#18191d] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-left"
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">💡 피드백 &amp; 기능 제안</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              면담 질문, DISC 분석 방식, 화면 개선 등 어떤 아이디어든 들려주세요. 작성한 내용으로 GitHub 이슈
              작성 화면이 열리고, 그 화면에서 등록하시면 됩니다.
            </p>
          </div>

          <div>
            <label htmlFor="feedback-content" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              의견 및 건의 사항 <span className="text-emerald-500">*</span>
            </label>
            <textarea
              id="feedback-content"
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예: 직무별 질문 템플릿이 더 다양하게 추가되면 좋겠습니다!"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
              GitHub 이슈는 누구나 볼 수 있습니다. 구성원 이름이나 면담 내용은 적지 마세요.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition shadow-sm"
            >
              <span>GitHub 이슈로 작성하기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
