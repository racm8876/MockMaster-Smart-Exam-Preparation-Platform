import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ReviewQuestionItem } from '../types';
import { MathText } from '../components/common/MathText';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Globe,
  Filter,
  Check,
  X,
  BookOpen,
} from 'lucide-react';

interface ExamReviewPageProps {
  attemptId: string;
  onBackToResult: () => void;
}

export const ExamReviewPage: React.FC<ExamReviewPageProps> = ({
  attemptId,
  onBackToResult,
}) => {
  const { token, language: globalLanguage } = useAuth();
  const [examTitleEn, setExamTitleEn] = useState('');
  const [examTitleHi, setExamTitleHi] = useState('');
  const [sections, setSections] = useState<{ id: string; nameEn: string; nameHi: string; questions: ReviewQuestionItem[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
  const [reviewLanguage, setReviewLanguage] = useState<'en' | 'hi'>(globalLanguage || 'en');

  useEffect(() => {
    async function loadReview() {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/review`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setExamTitleEn(data.examTitleEn);
          setExamTitleHi(data.examTitleHi);
          setSections(data.sections);
        } else {
          setError(data.error || 'Failed to load question review.');
        }
      } catch (err: any) {
        setError(err.message || 'Error communicating with server.');
      } finally {
        setLoading(false);
      }
    }
    loadReview();
  }, [attemptId, token]);

  if (loading) {
    return (
      <div className="py-20 text-center text-[#52635a]">
        <div className="w-10 h-10 border-4 border-[#173f35] border-t-[#c9ed71] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-[#173f35]">Fetching Authoritative Question Solutions & Explanations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-md mx-auto text-center bg-white rounded-2xl border border-red-200">
        <p className="text-sm font-bold text-red-600 mb-4">{error}</p>
        <button
          onClick={onBackToResult}
          className="px-4 py-2 bg-[#173f35] text-[#c9ed71] text-xs font-bold rounded-xl"
        >
          Back to Scorecard
        </button>
      </div>
    );
  }

  // Flatten all questions
  const allQuestions = sections.flatMap((sec) =>
    sec.questions.map((q) => ({ ...q, sectionNameEn: sec.nameEn, sectionNameHi: sec.nameHi }))
  );

  const filteredQuestions = allQuestions.filter((q) => {
    if (activeFilter === 'correct') return q.isCorrect;
    if (activeFilter === 'incorrect') return !q.isCorrect && !q.isUnanswered;
    if (activeFilter === 'unanswered') return q.isUnanswered;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Sticky Navigation */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#eceae1] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToResult}
            className="p-2 rounded-xl border border-[#cfcbbe] hover:bg-[#f6f5ee] text-[#173f35] transition-colors"
            title="Back to Score Summary"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#17241f] font-display">
              {reviewLanguage === 'hi' ? examTitleHi : examTitleEn}
            </h1>
            <p className="text-xs text-[#52635a]">Detailed Question-by-Question Solutions</p>
          </div>
        </div>

        {/* Language switch button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReviewLanguage((prev) => (prev === 'en' ? 'hi' : 'en'))}
            className="px-3 py-1.5 rounded-xl border border-[#cfcbbe] bg-[#f6f5ee] text-xs font-bold text-[#173f35] hover:bg-white flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{reviewLanguage === 'en' ? 'Switch to हिन्दी' : 'Switch to English'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'all'
              ? 'bg-[#173f35] text-[#c9ed71]'
              : 'bg-white border border-[#eceae1] text-[#52635a] hover:bg-[#f6f5ee]'
          }`}
        >
          All Questions ({allQuestions.length})
        </button>
        <button
          onClick={() => setActiveFilter('correct')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'correct'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-[#eceae1] text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          Correct ({allQuestions.filter((q) => q.isCorrect).length})
        </button>
        <button
          onClick={() => setActiveFilter('incorrect')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'incorrect'
              ? 'bg-red-600 text-white'
              : 'bg-white border border-[#eceae1] text-red-600 hover:bg-red-50'
          }`}
        >
          Incorrect ({allQuestions.filter((q) => !q.isCorrect && !q.isUnanswered).length})
        </button>
        <button
          onClick={() => setActiveFilter('unanswered')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'unanswered'
              ? 'bg-gray-700 text-white'
              : 'bg-white border border-[#eceae1] text-gray-700 hover:bg-gray-50'
          }`}
        >
          Unanswered ({allQuestions.filter((q) => q.isUnanswered).length})
        </button>
      </div>

      {/* Question Cards List */}
      <div className="space-y-6">
        {filteredQuestions.map((q, qIndex) => {
          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl p-6 border border-[#eceae1] shadow-xs space-y-4"
            >
              {/* Question header info */}
              <div className="flex items-center justify-between border-b border-[#eceae1] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-[#173f35]">
                    Q{qIndex + 1}.
                  </span>
                  <span className="text-xs text-[#52635a] font-medium">
                    {reviewLanguage === 'hi' ? q.sectionNameHi : q.sectionNameEn}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {q.isCorrect ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Correct (+{q.marksAwarded.toFixed(1)})
                    </span>
                  ) : q.isUnanswered ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                      Unattempted (0.0)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 flex items-center gap-1">
                      <X className="w-3 h-3" /> Incorrect ({q.marksAwarded.toFixed(1)})
                    </span>
                  )}
                  <span className="text-[11px] text-[#52635a] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {q.timeSpentSeconds}s
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-medium text-[#17241f] leading-relaxed">
                <MathText content={reviewLanguage === 'hi' ? q.textHi || q.textEn : q.textEn} />
              </div>

              {/* Options Breakdown */}
              <div className="space-y-2 pt-2">
                {q.options.map((opt, oIdx) => {
                  const isUserSelection = q.userSelectedOptionId === opt.id;
                  const isTheCorrectOption = opt.id === q.correctOptionId;
                  const optLetter = ['A', 'B', 'C', 'D'][oIdx] || '•';

                  let optClass = 'bg-[#f6f5ee] border-[#eceae1] text-[#17241f]';

                  if (isTheCorrectOption) {
                    optClass = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                  } else if (isUserSelection && !q.isCorrect) {
                    optClass = 'bg-red-50 border-red-500 text-red-950 font-semibold ring-1 ring-red-500';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs sm:text-sm ${optClass}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-bold text-xs uppercase w-5 text-center mt-0.5">
                          {optLetter}.
                        </span>
                        <div className="flex-1">
                          <MathText content={reviewLanguage === 'hi' ? opt.textHi || opt.textEn : opt.textEn} />
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-[11px]">
                        {isTheCorrectOption && (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Correct Answer
                          </span>
                        )}
                        {isUserSelection && !isTheCorrectOption && (
                          <span className="text-red-600 font-bold flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Your Choice
                          </span>
                        )}
                        {isUserSelection && isTheCorrectOption && (
                          <span className="text-emerald-700 font-bold">
                            (Your Choice)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step-by-Step Detailed Solution & Explanation */}
              <div className="bg-[#dff4e9]/40 border border-[#b8e6ce] rounded-xl p-4 space-y-2 mt-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#173f35] uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  <span>{reviewLanguage === 'hi' ? 'विस्तृत समाधान एवं व्याख्या:' : 'Detailed Solution & Explanation:'}</span>
                </div>
                <div className="text-xs sm:text-sm text-[#17241f] leading-relaxed">
                  <MathText
                    content={
                      reviewLanguage === 'hi'
                        ? q.explanationHi || q.explanationEn
                        : q.explanationEn
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
