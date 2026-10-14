import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExamResultSummary } from '../types';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Target,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Share2,
} from 'lucide-react';

interface ExamResultPageProps {
  attemptId: string;
  onGoToReview: (attemptId: string) => void;
  onGoToDashboard: () => void;
}

export const ExamResultPage: React.FC<ExamResultPageProps> = ({
  attemptId,
  onGoToReview,
  onGoToDashboard,
}) => {
  const { token, language } = useAuth();
  const [result, setResult] = useState<ExamResultSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/result`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setResult(data.result);
        } else {
          setError(data.error || 'Failed to load exam result.');
        }
      } catch (err: any) {
        setError(err.message || 'Error communicating with score server.');
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId, token]);

  if (loading) {
    return (
      <div className="py-20 text-center text-[#52635a]">
        <div className="w-10 h-10 border-4 border-[#173f35] border-t-[#c9ed71] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-[#173f35]">Compiling Official Scorecard & Percentile...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-8 max-w-md mx-auto text-center bg-white rounded-2xl border border-red-200">
        <p className="text-sm font-bold text-red-600 mb-4">{error || 'Score record not found.'}</p>
        <button
          onClick={onGoToDashboard}
          className="px-4 py-2 bg-[#173f35] text-[#c9ed71] text-xs font-bold rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const percentage = Math.round((result.score / (result.totalMarks || 1)) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Exam metadata */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dff4e9] text-[#173f35] text-xs font-bold">
          <Award className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'आधिकारिक सीबीटी परीक्षा परिणाम' : 'Authoritative CBT Score Report'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17241f] font-display">
          {language === 'hi' ? result.examTitleHi || 'मॉक टेस्ट स्कोरकार्ड' : result.examTitleEn || 'Mock Test Scorecard'}
        </h1>
        <p className="text-xs text-[#52635a]">
          Submitted on {new Date(result.submittedAt || Date.now()).toLocaleString()}
        </p>
      </div>

      {/* Main Score Showcase Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#eceae1] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left: Obtained marks */}
        <div className="text-center md:text-left space-y-2 md:border-r border-[#eceae1] md:pr-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#52635a]">
            {language === 'hi' ? 'कुल प्राप्तांक' : 'Marks Obtained'}
          </span>
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="text-4xl sm:text-5xl font-black text-[#173f35] font-display">
              {result.score.toFixed(1)}
            </span>
            <span className="text-base font-bold text-[#52635a]">
              / {result.totalMarks}
            </span>
          </div>
          <div className="text-xs font-semibold text-[#173f35]">
            Percentage: <span className="font-extrabold">{percentage}%</span>
          </div>
        </div>

        {/* Center: Rank & Percentile */}
        <div className="text-center space-y-2 md:border-r border-[#eceae1] md:pr-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#52635a]">
            {language === 'hi' ? 'अखिल भारतीय रैंक' : 'All-India Rank'}
          </span>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#ef765f] font-display">
              #{result.rank ?? 1}
            </span>
            <span className="text-xs text-[#52635a]">
              of {result.totalTestTakers ?? 1} candidates
            </span>
          </div>
          <div className="text-xs font-semibold text-[#173f35]">
            Percentile: <span className="font-extrabold">{result.percentile ?? 95.0}%</span>
          </div>
        </div>

        {/* Right: Accuracy & Time */}
        <div className="text-center space-y-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#52635a] block mb-1">
              Accuracy Rate
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#17241f] font-display">
              {result.accuracyPercentage}%
            </span>
          </div>
          <div className="text-xs text-[#52635a] flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Time Taken: {Math.round(result.timeSpentSeconds / 60)} mins</span>
          </div>
        </div>
      </div>

      {/* Answer Distribution Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs text-center">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="block text-xl sm:text-2xl font-black text-emerald-700 font-display">
            {result.correctCount}
          </span>
          <span className="text-xs font-bold text-[#52635a]">Correct (+{result.correctCount * 2} marks)</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-red-200 shadow-xs text-center">
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center mb-2">
            <XCircle className="w-4 h-4" />
          </div>
          <span className="block text-xl sm:text-2xl font-black text-red-700 font-display">
            {result.incorrectCount}
          </span>
          <span className="text-xs font-bold text-[#52635a]">Incorrect (-{(result.incorrectCount * 0.5).toFixed(1)} marks)</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs text-center">
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 mx-auto flex items-center justify-center mb-2">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="block text-xl sm:text-2xl font-black text-gray-700 font-display">
            {result.unansweredCount}
          </span>
          <span className="text-xs font-bold text-[#52635a]">Unanswered (0 penalty)</span>
        </div>
      </div>

      {/* Section-Wise Breakdown Table */}
      {result.sectionScores && Object.keys(result.sectionScores).length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-[#eceae1] shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-[#17241f] font-display">
            {language === 'hi' ? 'अनुभाग-वार प्रदर्शन विवरण' : 'Sectional Mastery Breakdown'}
          </h3>

          <div className="divide-y divide-[#eceae1]">
            {Object.values(result.sectionScores).map((sec) => {
              const secPercentage = sec.maxMarks > 0 ? Math.round((sec.score / sec.maxMarks) * 100) : 0;
              return (
                <div key={sec.sectionId} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-bold text-xs sm:text-sm text-[#17241f]">
                      {language === 'hi' ? sec.sectionNameHi : sec.sectionNameEn}
                    </span>
                    <div className="text-[11px] text-[#52635a] flex items-center gap-3">
                      <span className="text-emerald-700 font-semibold">{sec.correct} Correct</span>
                      <span className="text-red-600 font-semibold">{sec.incorrect} Incorrect</span>
                      <span>{sec.unanswered} Skipped</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-[#eceae1] rounded-full h-2.5 overflow-hidden hidden sm:block">
                      <div
                        className="bg-[#173f35] h-full rounded-full"
                        style={{ width: `${Math.max(0, Math.min(100, secPercentage))}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-[#173f35]">{sec.score.toFixed(1)}</span>
                      <span className="text-xs text-[#52635a]"> / {sec.maxMarks}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#f6f5ee] rounded-2xl border border-[#eceae1]">
        <button
          onClick={onGoToDashboard}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#cfcbbe] text-xs font-bold text-[#52635a] hover:bg-white transition-colors"
        >
          Return to Dashboard
        </button>

        <button
          onClick={() => onGoToReview(attemptId)}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>{language === 'hi' ? 'सभी प्रश्नों के समाधान देखें' : 'Review Questions & Solutions'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
