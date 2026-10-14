import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ClientExam,
  ClientExamSection,
  ClientQuestion,
  ExamAttemptState,
  QuestionAttemptStatus,
  AttemptAnswer,
} from '../types';
import { MathText } from '../components/common/MathText';
import {
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  X,
  Maximize2,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CbtTestPageProps {
  examId: string;
  onExamSubmitted: (attemptId: string) => void;
  onExitTest: () => void;
}

export const CbtTestPage: React.FC<CbtTestPageProps> = ({
  examId,
  onExamSubmitted,
  onExitTest,
}) => {
  const { token, user, language: globalLanguage } = useAuth();

  // Test state
  const [exam, setExam] = useState<ClientExam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttemptState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active navigation
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [activeQuestionId, setActiveQuestionId] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>(globalLanguage || 'en');

  // Timer state
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submitting modal state
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');

  // Mobile drawer state for palette
  const [showMobilePalette, setShowMobilePalette] = useState<boolean>(false);

  // Load or start attempt from server
  useEffect(() => {
    let isMounted = true;

    async function initTest() {
      if (!token) {
        setError('Please log in to start or resume a test attempt.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/exams/${examId}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!isMounted) return;

        if (data.success) {
          setExam(data.exam);
          setAttempt(data.attempt);

          // Calculate remaining seconds
          const expiryTime = new Date(data.attempt.expiresAt).getTime();
          const now = Date.now();
          const remainingSecs = Math.max(0, Math.floor((expiryTime - now) / 1000));
          setTimeLeftSeconds(remainingSecs);

          // Set default section & question
          if (data.exam.sections && data.exam.sections.length > 0) {
            const firstSec = data.exam.sections[0];
            setActiveSectionId(firstSec.id);
            if (firstSec.questions && firstSec.questions.length > 0) {
              const defaultQId = data.attempt.currentQuestionId || firstSec.questions[0].id;
              setActiveQuestionId(defaultQId);
            }
          }
        } else {
          setError(data.error || 'Failed to initialize exam session.');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Network error connecting to exam server.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initTest();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId, token]);

  // Server-authoritative timer ticker
  useEffect(() => {
    if (loading || !attempt) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmitOnExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, attempt]);

  // Window leave prevention
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Your exam is currently in progress. Navigating away might submit your exam.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Format countdown string
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Persist response to server
  const saveQuestionAnswer = useCallback(
    async (qId: string, optId: string | undefined, status: QuestionAttemptStatus) => {
      if (!attempt || !token) return;

      setSyncStatus('saving');

      // Optimistically update local attempt state
      setAttempt((prev) => {
        if (!prev) return prev;
        const currentAnswer = prev.answers[qId] || {
          questionId: qId,
          status: 'NOT_VISITED',
          timeSpentSeconds: 0,
        };
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [qId]: {
              ...currentAnswer,
              selectedOptionId: optId,
              status,
              timeSpentSeconds: (currentAnswer.timeSpentSeconds || 0) + 1,
            },
          },
        };
      });

      try {
        const res = await fetch(`/api/attempts/${attempt.id}/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionId: qId,
            selectedOptionId: optId,
            status,
            currentQuestionId: qId,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setSyncStatus('synced');
        } else if (data.isExpired) {
          handleAutoSubmitOnExpiry();
        } else {
          setSyncStatus('error');
        }
      } catch {
        setSyncStatus('error');
      }
    },
    [attempt, token]
  );

  // Active question and section computation
  const activeSection = exam?.sections?.find((s) => s.id === activeSectionId) || exam?.sections?.[0];
  const activeQuestion = activeSection?.questions.find((q) => q.id === activeQuestionId) || activeSection?.questions[0];

  // Current answer state for active question
  const currentAnswerState = activeQuestion && attempt ? attempt.answers[activeQuestion.id] : undefined;
  const currentSelectedOptionId = currentAnswerState?.selectedOptionId;

  // Flatten all questions for linear pagination
  const allQuestions = exam?.sections?.flatMap((s) => s.questions) || [];
  const currentOverallIndex = allQuestions.findIndex((q) => q.id === activeQuestion?.id);

  // Move to a question and set it visited if not visited
  const navigateToQuestion = (targetQId: string) => {
    // Find section containing targetQId
    const targetSec = exam?.sections?.find((s) => s.questions.some((q) => q.id === targetQId));
    if (targetSec && targetSec.id !== activeSectionId) {
      setActiveSectionId(targetSec.id);
    }

    setActiveQuestionId(targetQId);

    // If target question was NOT_VISITED, mark it NOT_ANSWERED
    if (attempt && attempt.answers[targetQId]?.status === 'NOT_VISITED') {
      saveQuestionAnswer(targetQId, undefined, 'NOT_ANSWERED');
    }
  };

  // Button actions: Save & Next
  const handleSaveAndNext = () => {
    if (!activeQuestion) return;
    const newStatus: QuestionAttemptStatus = currentSelectedOptionId ? 'ANSWERED' : 'NOT_ANSWERED';
    saveQuestionAnswer(activeQuestion.id, currentSelectedOptionId, newStatus);

    // Advance to next question
    if (currentOverallIndex < allQuestions.length - 1) {
      const nextQ = allQuestions[currentOverallIndex + 1];
      navigateToQuestion(nextQ.id);
    }
  };

  // Button actions: Mark for Review & Next
  const handleMarkForReviewAndNext = () => {
    if (!activeQuestion) return;
    const newStatus: QuestionAttemptStatus = currentSelectedOptionId
      ? 'ANSWERED_AND_MARKED'
      : 'MARKED_FOR_REVIEW';
    saveQuestionAnswer(activeQuestion.id, currentSelectedOptionId, newStatus);

    if (currentOverallIndex < allQuestions.length - 1) {
      const nextQ = allQuestions[currentOverallIndex + 1];
      navigateToQuestion(nextQ.id);
    }
  };

  // Button actions: Clear Response
  const handleClearResponse = () => {
    if (!activeQuestion) return;
    saveQuestionAnswer(activeQuestion.id, undefined, 'NOT_ANSWERED');
  };

  // Button actions: Select option
  const handleSelectOption = (optionId: string) => {
    if (!activeQuestion) return;
    saveQuestionAnswer(activeQuestion.id, optionId, 'ANSWERED');
  };

  // Submission handler
  const handleFinalSubmit = async () => {
    if (!attempt || !token || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        onExamSubmitted(attempt.id);
      } else {
        alert(data.error || 'Submission failed. Please retry.');
      }
    } catch (err: any) {
      alert('Error submitting exam: ' + err.message);
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Auto-submit when time reaches zero
  const handleAutoSubmitOnExpiry = async () => {
    if (!attempt || !token) return;
    try {
      await fetch(`/api/attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Time has expired! Your exam has been submitted automatically.');
      onExamSubmitted(attempt.id);
    } catch {
      onExamSubmitted(attempt.id);
    }
  };

  // Palette summary counts
  const answeredCount = Object.values(attempt?.answers || {}).filter(
    (a) => a.status === 'ANSWERED' || a.status === 'ANSWERED_AND_MARKED'
  ).length;
  const markedCount = Object.values(attempt?.answers || {}).filter(
    (a) => a.status === 'MARKED_FOR_REVIEW' || a.status === 'ANSWERED_AND_MARKED'
  ).length;
  const notAnsweredCount = Object.values(attempt?.answers || {}).filter(
    (a) => a.status === 'NOT_ANSWERED'
  ).length;
  const notVisitedCount = allQuestions.length - answeredCount - notAnsweredCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f5ee] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#173f35] border-t-[#c9ed71] animate-spin mb-4" />
        <h2 className="text-base font-bold text-[#173f35]">Initializing Secure CBT Exam Session...</h2>
        <p className="text-xs text-[#52635a] mt-1">Synchronizing question papers and countdown timer with the server.</p>
      </div>
    );
  }

  if (error || !exam || !attempt) {
    return (
      <div className="min-h-screen bg-[#f6f5ee] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-red-200 shadow-md text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-base font-bold text-[#17241f]">Exam Session Error</h2>
          <p className="text-xs text-[#52635a]">{error || 'Unable to load test content.'}</p>
          <button
            onClick={onExitTest}
            className="px-4 py-2 bg-[#173f35] text-[#c9ed71] text-xs font-bold rounded-xl"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Palette grid rendering helper
  const renderPaletteGrid = () => (
    <div className="space-y-4">
      {/* Legend */}
      <div className="p-3 bg-[#f6f5ee] rounded-xl border border-[#eceae1] space-y-2 text-[11px]">
        <div className="font-bold text-[#173f35] text-xs uppercase tracking-wider">
          {selectedLanguage === 'hi' ? 'प्रश्नों की स्थिति (संकेतक)' : 'Question Legend'}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
              {answeredCount}
            </span>
            <span className="text-[#17241f] font-medium">Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-red-600 text-white font-bold text-xs flex items-center justify-center">
              {notAnsweredCount}
            </span>
            <span className="text-[#17241f] font-medium">Not Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
              {markedCount}
            </span>
            <span className="text-[#17241f] font-medium">Marked for Review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center border border-gray-300">
              {Math.max(0, notVisitedCount)}
            </span>
            <span className="text-[#17241f] font-medium">Not Visited</span>
          </div>
        </div>
      </div>

      {/* Section Filter Tabs inside palette */}
      <div>
        <div className="text-xs font-bold text-[#173f35] mb-2 uppercase tracking-wider">
          {selectedLanguage === 'hi' ? 'अनुभाग चुनें:' : 'Section Palette:'}
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {(exam.sections || []).map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                setActiveSectionId(sec.id);
                if (sec.questions[0]) navigateToQuestion(sec.questions[0].id);
              }}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                activeSectionId === sec.id
                  ? 'bg-[#173f35] text-[#c9ed71]'
                  : 'bg-[#eceae1] text-[#52635a] hover:bg-[#cfcbbe]'
              }`}
            >
              {selectedLanguage === 'hi' ? sec.nameHi.slice(0, 12) + '...' : sec.nameEn.slice(0, 12) + '...'}
            </button>
          ))}
        </div>

        {/* Question number buttons */}
        <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
          {activeSection?.questions.map((q, idx) => {
            const ans = attempt.answers[q.id];
            const isCurrent = q.id === activeQuestion?.id;
            let btnClass = 'bg-gray-100 text-gray-700 border-gray-300'; // Not visited

            if (ans?.status === 'ANSWERED') {
              btnClass = 'bg-emerald-600 text-white border-emerald-700';
            } else if (ans?.status === 'ANSWERED_AND_MARKED') {
              btnClass = 'bg-purple-600 text-[#c9ed71] border-purple-800 font-black';
            } else if (ans?.status === 'MARKED_FOR_REVIEW') {
              btnClass = 'bg-purple-600 text-white border-purple-700';
            } else if (ans?.status === 'NOT_ANSWERED') {
              btnClass = 'bg-red-600 text-white border-red-700';
            }

            return (
              <button
                key={q.id}
                onClick={() => {
                  navigateToQuestion(q.id);
                  setShowMobilePalette(false);
                }}
                className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center border shadow-xs transition-transform ${btnClass} ${
                  isCurrent ? 'ring-2 ring-offset-1 ring-[#173f35] scale-105' : ''
                }`}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#f6f5ee] flex flex-col overflow-hidden select-none">
      {/* 1. TOP CBT HEADER */}
      <header className="h-14 bg-[#173f35] text-white px-4 sm:px-6 flex items-center justify-between shadow-md shrink-0 border-b border-[#235447]">
        {/* Left: Exam title & Section title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#c9ed71] text-[#173f35] font-black flex items-center justify-center text-sm shadow-xs shrink-0">
            CBT
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold truncate text-white">
              {selectedLanguage === 'hi' ? exam.titleHi : exam.titleEn}
            </h1>
            <div className="text-[10px] text-[#b8e6ce] flex items-center gap-2">
              <span>Sec: {selectedLanguage === 'hi' ? activeSection?.nameHi : activeSection?.nameEn}</span>
              <span>•</span>
              <span>+2.0 / -0.5 Mark</span>
            </div>
          </div>
        </div>

        {/* Right: Language Selector & Countdown Timer */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Real-time Language Switcher (Zero reset of answers) */}
          <div className="flex items-center gap-1 bg-[#0f2c25] px-2 py-1 rounded-lg border border-[#235447]">
            <Globe className="w-3.5 h-3.5 text-[#c9ed71]" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as 'en' | 'hi')}
              className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
            >
              <option value="en" className="bg-[#173f35] text-white">
                English
              </option>
              <option value="hi" className="bg-[#173f35] text-white">
                हिन्दी
              </option>
            </select>
          </div>

          {/* Countdown Timer with color alerts */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-extrabold text-xs sm:text-sm shadow-inner transition-colors ${
              timeLeftSeconds < 300
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-[#0f2c25] text-[#c9ed71] border border-[#235447]'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          {/* Mobile Palette Toggle Button */}
          <button
            onClick={() => setShowMobilePalette(true)}
            className="lg:hidden p-1.5 rounded-lg bg-[#0f2c25] text-[#c9ed71] border border-[#235447] text-xs font-bold"
          >
            Palette ({answeredCount}/{allQuestions.length})
          </button>
        </div>
      </header>

      {/* 2. SECTION TABS BAR */}
      <div className="h-11 bg-white border-b border-[#eceae1] px-4 sm:px-6 flex items-center justify-between shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2">
          {(exam.sections || []).map((sec, idx) => {
            const isSecActive = sec.id === activeSectionId;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSectionId(sec.id);
                  if (sec.questions[0]) navigateToQuestion(sec.questions[0].id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSecActive
                    ? 'bg-[#173f35] text-[#c9ed71] shadow-xs'
                    : 'text-[#52635a] hover:bg-[#f6f5ee] hover:text-[#17241f]'
                }`}
              >
                <span>{idx + 1}. {selectedLanguage === 'hi' ? sec.nameHi : sec.nameEn}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-black/10">
                  {sec.questions.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sync Indicator */}
        <div className="text-[11px] text-[#52635a] hidden sm:flex items-center gap-1">
          {syncStatus === 'saving' && <span className="text-amber-600 animate-pulse">Syncing...</span>}
          {syncStatus === 'synced' && <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Auto-saved</span>}
          {syncStatus === 'error' && <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Offline (retrying)</span>}
        </div>
      </div>

      {/* 3. MAIN QUESTION WORKSPACE & PALETTE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / CENTER: Active Question Container */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-white max-w-5xl">
          {activeQuestion ? (
            <div className="flex-1 flex flex-col justify-between space-y-6">
              {/* Question Header & Meta */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#eceae1] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base sm:text-lg text-[#173f35]">
                      Question {currentOverallIndex + 1}
                    </span>
                    <span className="text-xs text-[#52635a]">
                      of {allQuestions.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#dff4e9] text-[#173f35]">
                      +{activeQuestion.positiveMarks.toFixed(1)} Correct
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#ffece8] text-[#ef765f]">
                      -{activeQuestion.negativeMarks.toFixed(1)} Wrong
                    </span>
                  </div>
                </div>

                {/* Question Text (rendered via MathText KaTeX) */}
                <div className="text-sm sm:text-base font-medium text-[#17241f] leading-relaxed bg-[#f6f5ee]/50 p-4 rounded-xl border border-[#eceae1]">
                  <MathText
                    content={
                      selectedLanguage === 'hi'
                        ? activeQuestion.textHi || activeQuestion.textEn
                        : activeQuestion.textEn
                    }
                  />
                </div>

                {/* Optional Question Image */}
                {activeQuestion.imageUrl && (
                  <div className="my-3 max-w-md mx-auto">
                    <img
                      src={activeQuestion.imageUrl}
                      alt="Question diagram"
                      className="rounded-xl border border-[#eceae1] max-h-60 object-contain mx-auto"
                    />
                  </div>
                )}

                {/* 4 Single-Choice Options */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-bold text-[#52635a] uppercase tracking-wider">
                    {selectedLanguage === 'hi' ? 'दिए गए विकल्पों में से एक चुनें:' : 'Select one option:'}
                  </div>
                  {activeQuestion.options.map((opt, optIndex) => {
                    const isSelected = currentSelectedOptionId === opt.id;
                    const optionLetter = ['A', 'B', 'C', 'D'][optIndex] || '•';

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#dff4e9] border-[#173f35] text-[#173f35] shadow-xs'
                            : 'bg-white border-[#cfcbbe] hover:bg-[#f6f5ee] text-[#17241f]'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-[#173f35] text-[#c9ed71]'
                              : 'bg-[#eceae1] text-[#52635a]'
                          }`}
                        >
                          {optionLetter}
                        </div>
                        <div className="flex-1 text-xs sm:text-sm font-semibold leading-relaxed">
                          <MathText
                            content={
                              selectedLanguage === 'hi'
                                ? opt.textHi || opt.textEn
                                : opt.textEn
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status info note */}
              <div className="text-[11px] text-[#52635a] flex items-center gap-2 pt-2 border-t border-[#eceae1]">
                <HelpCircle className="w-3.5 h-3.5 text-[#173f35]" />
                <span>
                  {selectedLanguage === 'hi'
                    ? 'विकल्प पर क्लिक करते ही वह स्वतः सुरक्षित (Saved) हो जाता है।'
                    : 'Clicking an option records your response immediately on the secure server.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-[#52635a]">Select a question from the palette</div>
          )}
        </main>

        {/* RIGHT: DESKTOP QUESTION PALETTE (Fixed Side Panel) */}
        <aside className="hidden lg:block w-80 bg-white border-l border-[#eceae1] p-4 overflow-y-auto shrink-0 shadow-xs">
          {renderPaletteGrid()}
        </aside>
      </div>

      {/* 4. BOTTOM ACTION TOOLBAR */}
      <footer className="h-16 bg-white border-t border-[#eceae1] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-lg">
        {/* Left Actions: Previous & Clear */}
        <div className="flex items-center gap-2">
          <button
            disabled={currentOverallIndex <= 0}
            onClick={() => {
              if (currentOverallIndex > 0) {
                navigateToQuestion(allQuestions[currentOverallIndex - 1].id);
              }
            }}
            className="px-3 py-2 rounded-xl border border-[#cfcbbe] text-xs font-bold text-[#52635a] hover:bg-[#f6f5ee] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <button
            onClick={handleClearResponse}
            className="px-3 py-2 rounded-xl border border-[#cfcbbe] text-xs font-bold text-[#ef765f] hover:bg-red-50 transition-colors flex items-center gap-1"
            title="Clear current answer choice"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Center / Right Actions: Mark For Review & Save Next */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleMarkForReviewAndNext}
            className="px-3 sm:px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Mark for Review & Next</span>
          </button>

          <button
            onClick={handleSaveAndNext}
            className="px-4 sm:px-5 py-2 rounded-xl bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Save & Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Big Accent Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 sm:px-5 py-2 rounded-xl bg-[#ef765f] hover:bg-[#dc583f] text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </footer>

      {/* 5. MOBILE PALETTE DRAWER */}
      {showMobilePalette && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowMobilePalette(false)}
          />
          <div className="relative ml-auto w-80 max-w-[85vw] h-full bg-white shadow-2xl p-4 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#eceae1] mb-3">
                <h3 className="font-bold text-sm text-[#173f35]">Question Palette</h3>
                <button
                  onClick={() => setShowMobilePalette(false)}
                  className="p-1 text-[#52635a]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderPaletteGrid()}
            </div>
            <button
              onClick={() => {
                setShowMobilePalette(false);
                setShowSubmitModal(true);
              }}
              className="mt-4 w-full py-2.5 bg-[#ef765f] text-white rounded-xl font-bold text-xs shadow-md"
            >
              Submit Exam
            </button>
          </div>
        </div>
      )}

      {/* 6. SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#eceae1] overflow-hidden">
            <div className="bg-[#173f35] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#c9ed71]" />
                <h3 className="font-extrabold text-base text-white">Confirm Exam Submission</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-[#dff4e9] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-[#17241f]">
              <p className="text-xs text-[#52635a] leading-relaxed">
                Please verify your attempt breakdown before final submission. Once submitted, your answers will be permanently locked and authoritatively scored on the server.
              </p>

              {/* Status Breakdown Table */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#f6f5ee] rounded-xl border border-[#eceae1] text-xs">
                <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <span className="text-[#52635a]">Total Questions:</span>
                  <span className="font-bold text-[#17241f]">{allQuestions.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded-lg text-emerald-700">
                  <span>Answered:</span>
                  <span className="font-bold">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded-lg text-red-600">
                  <span>Unanswered:</span>
                  <span className="font-bold">{allQuestions.length - answeredCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded-lg text-purple-700">
                  <span>Marked Review:</span>
                  <span className="font-bold">{markedCount}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-snug">
                ⚠️ You still have <strong>{formatTime(timeLeftSeconds)}</strong> remaining on the clock.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#cfcbbe] text-xs font-bold text-[#52635a] hover:bg-[#f6f5ee]"
                >
                  Return to Test
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef765f] hover:bg-[#dc583f] text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Scoring...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Yes, Submit Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
