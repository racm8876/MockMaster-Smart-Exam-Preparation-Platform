import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ClientExam, CalendarEvent, StudentGoal } from '../../types';
import {
  Clock,
  Calendar,
  Flame,
  ArrowRight,
  Bell,
  CheckCircle2,
  Target,
  Sparkles,
  Zap,
  ChevronDown,
  BookOpen,
  Award,
} from 'lucide-react';

export interface ScheduledExamItem {
  id: string;
  examId?: string;
  titleEn: string;
  titleHi: string;
  categoryEn: string;
  categoryHi: string;
  targetDateTime: string; // ISO string or YYYY-MM-DDTHH:mm:ss
  totalMarks: number;
  durationMinutes: number;
  totalQuestions: number;
  markingScheme: string;
  type: 'NATIONAL_MOCK' | 'CALENDAR_EXAM' | 'PERSONAL_GOAL';
  status: 'UPCOMING' | 'STARTING_SOON' | 'LIVE_NOW';
  descriptionEn?: string;
  descriptionHi?: string;
}

interface ScheduledExamCountdownProps {
  exams: ClientExam[];
  events: CalendarEvent[];
  goal: StudentGoal | null;
  onStartExam: (examId: string) => void;
  onNavigateTab: (tab: any) => void;
  onTaskAdded?: () => void;
}

export const ScheduledExamCountdown: React.FC<ScheduledExamCountdownProps> = ({
  exams,
  events,
  goal,
  onStartExam,
  onNavigateTab,
  onTaskAdded,
}) => {
  const { language, token } = useAuth();
  const [reminderSaved, setReminderSaved] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Assemble list of available scheduled exams
  const scheduledList = useMemo<ScheduledExamItem[]>(() => {
    const list: ScheduledExamItem[] = [];

    // 1. First published exam with scheduled time window (SSC CGL 2026 Tier 1 Mock)
    const primaryExam = exams.find((e) => e.id === 'exam-ssc-cgl-01') || exams[0];
    if (primaryExam) {
      list.push({
        id: `scheduled-${primaryExam.id}`,
        examId: primaryExam.id,
        titleEn: primaryExam.titleEn,
        titleHi: primaryExam.titleHi,
        categoryEn: primaryExam.categoryNameEn || 'Staff Selection Commission (SSC)',
        categoryHi: primaryExam.categoryNameHi || 'कर्मचारी चयन आयोग (एसएससी)',
        // Next Saturday 10:00 AM or near future date
        targetDateTime: '2026-10-25T10:00:00',
        totalMarks: primaryExam.totalMarks || 40,
        durationMinutes: primaryExam.durationMinutes || 30,
        totalQuestions: primaryExam.totalQuestions || 20,
        markingScheme: '+2.0 / -0.5',
        type: 'NATIONAL_MOCK',
        status: 'UPCOMING',
        descriptionEn: 'All-India live bilingual computer-based simulation with instant percentile and ranking.',
        descriptionHi: 'तत्काल पर्सेंटाइल और अखिल भारतीय रैंक विश्लेषण के साथ वास्तविक सीबीटी परीक्षा।',
      });
    }

    // 2. Second exam (IBPS PO Prelims Speed Drill)
    const bankingExam = exams.find((e) => e.id === 'exam-ibps-speed-01');
    if (bankingExam) {
      list.push({
        id: `scheduled-${bankingExam.id}`,
        examId: bankingExam.id,
        titleEn: bankingExam.titleEn,
        titleHi: bankingExam.titleHi,
        categoryEn: bankingExam.categoryNameEn || 'Banking & Insurance',
        categoryHi: bankingExam.categoryNameHi || 'बैंकिंग एवं बीमा',
        targetDateTime: '2026-11-08T09:00:00',
        totalMarks: bankingExam.totalMarks || 20,
        durationMinutes: bankingExam.durationMinutes || 15,
        totalQuestions: bankingExam.totalQuestions || 10,
        markingScheme: '+1.0 / -0.25',
        type: 'NATIONAL_MOCK',
        status: 'UPCOMING',
        descriptionEn: 'High-speed preliminary drill under strict time bounds for banking aspirants.',
        descriptionHi: 'समय-सीमा में सटीकता और गति परखने हेतु बैंकिंग गति अभ्यास टेस्ट।',
      });
    }

    // 3. Calendar official exam event (e.g. IBPS PO Phase 1 or upcoming notification exams)
    const officialExamEvt = events.find((evt) => evt.type === 'EXAM');
    if (officialExamEvt) {
      list.push({
        id: `calendar-${officialExamEvt.id}`,
        titleEn: officialExamEvt.titleEn,
        titleHi: officialExamEvt.titleHi,
        categoryEn: 'National Examination Portal',
        categoryHi: 'राष्ट्रीय परीक्षा पोर्टल',
        targetDateTime: `${officialExamEvt.date}T09:30:00`,
        totalMarks: 0,
        durationMinutes: 0,
        totalQuestions: 0,
        markingScheme: 'Not specified',
        type: 'CALENDAR_EXAM',
        status: 'UPCOMING',
        descriptionEn: officialExamEvt.descriptionEn || 'Official nationwide preliminary examination.',
        descriptionHi: officialExamEvt.descriptionHi || 'देश भर में आयोजित होने वाली आधिकारिक परीक्षा।',
      });
    }

    // 4. Student's target goal
    if (goal && goal.targetDate) {
      list.push({
        id: `goal-${goal.id}`,
        titleEn: `Target Goal: ${goal.targetExamEn}`,
        titleHi: `व्यक्तिगत लक्ष्य: ${goal.targetExamHi}`,
        categoryEn: 'Aspirant Target Milestone',
        categoryHi: 'अभ्यर्थी व्यक्तिगत लक्ष्य',
        targetDateTime: `${goal.targetDate}T09:00:00`,
        totalMarks: goal.targetScore,
        durationMinutes: 60,
        totalQuestions: 100,
        markingScheme: 'Custom Target',
        type: 'PERSONAL_GOAL',
        status: 'UPCOMING',
        descriptionEn: `Target Score: ${goal.targetScore} marks • Daily study commitment: ${goal.dailyStudyHours} hrs`,
        descriptionHi: `लक्ष्य प्राप्तांक: ${goal.targetScore} अंक • दैनिक अध्ययन: ${goal.dailyStudyHours} घंटे`,
      });
    }

    // Published exams are immediately available and do not imply a schedule.
    // This widget only renders administrator-created calendar events and the
    // student's own goal—never dates manufactured in the client.
    return list.filter((item) => item.type !== 'NATIONAL_MOCK');
  }, [exams, events, goal]);

  // Set default selected exam
  useEffect(() => {
    if (scheduledList.length > 0 && !selectedExamId) {
      setSelectedExamId(scheduledList[0].id);
    }
  }, [scheduledList, selectedExamId]);

  const activeItem = useMemo(() => {
    return scheduledList.find((item) => item.id === selectedExamId) || scheduledList[0];
  }, [scheduledList, selectedExamId]);

  // Real-time ticking state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isLive: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isLive: false,
  });

  useEffect(() => {
    if (!activeItem) return;

    function updateCountdown() {
      const targetTime = new Date(activeItem.targetDateTime).getTime();
      const now = Date.now();
      const diffMs = targetTime - now;

      if (diffMs <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isLive: true,
        });
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSec / (3600 * 24));
      const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        totalSeconds: totalSec,
        isLive: false,
      });
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeItem]);

  // Progress Bar Calculation:
  // We model a 30-day preparation sprint window ending on the target date.
  // Elapsed % = ((30 days - remaining days) / 30 days) * 100
  const progressPercent = useMemo(() => {
    if (timeLeft.isLive) return 100;
    const sprintDurationDays = 30;
    const remainingDaysFraction = timeLeft.totalSeconds / (3600 * 24);
    const elapsedDays = Math.max(0, sprintDurationDays - remainingDaysFraction);
    const pct = Math.min(100, Math.max(5, Math.round((elapsedDays / sprintDurationDays) * 100)));
    return pct;
  }, [timeLeft]);

  const handleSetReminder = async () => {
    if (!token || !activeItem) return;
    try {
      const taskTitle = language === 'hi'
        ? `मॉक टेस्ट अभ्यास: ${activeItem.titleHi}`
        : `Take Scheduled Mock Exam: ${activeItem.titleEn}`;
      const dueDate = activeItem.targetDateTime.split('T')[0];

      await fetch('/api/planner/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle,
          dueDate,
          priority: 'HIGH',
        }),
      });

      setReminderSaved(true);
      onTaskAdded?.();
      setTimeout(() => setReminderSaved(false), 4000);
    } catch (e) {
      console.error('Failed to set study task reminder', e);
    }
  };

  if (!activeItem) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-[#eceae1] shadow-xs transition-all hover:border-[#cfcbbe]">
      {/* Top Banner Header with Status and Switcher */}
      <div className="bg-gradient-to-r from-[#173f35] to-[#1f4e42] text-white px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#c9ed71] text-[#173f35] text-[11px] font-black tracking-wide uppercase shadow-xs">
            {timeLeft.isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>{language === 'hi' ? 'लाइव उपलब्ध' : 'LIVE NOW'}</span>
              </>
            ) : timeLeft.days <= 1 ? (
              <>
                <Zap className="w-3.5 h-3.5 text-[#173f35]" />
                <span>{language === 'hi' ? 'शीघ्र शुरू होगा' : 'STARTING SOON'}</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-[#173f35]" />
                <span>{language === 'hi' ? 'आगामी शेड्यूल मॉक' : 'SCHEDULED MOCK TEST'}</span>
              </>
            )}
          </div>

          <span className="text-xs text-[#b8e6ce] font-semibold hidden md:inline">
            {activeItem.categoryEn}
          </span>
        </div>

        {/* Dropdown selector for multiple scheduled exams / goals */}
        {scheduledList.length > 1 && (
          <div className="relative shrink-0">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="appearance-none bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg border border-white/20 focus:outline-none cursor-pointer transition-colors"
            >
              {scheduledList.map((item) => (
                <option key={item.id} value={item.id} className="text-[#17241f] bg-white">
                  {language === 'hi' ? item.titleHi : item.titleEn}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#c9ed71] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="p-5 sm:p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Details: Exam Name, Scheduled Slot & Blueprint */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#173f35]">
              <Calendar className="w-4 h-4 text-[#173f35]" />
              <span>
                {new Date(activeItem.targetDateTime).toLocaleDateString(
                  language === 'hi' ? 'hi-IN' : 'en-US',
                  {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }
                )}
                {' • '}
                {new Date(activeItem.targetDateTime).toLocaleTimeString(
                  language === 'hi' ? 'hi-IN' : 'en-US',
                  { hour: '2-digit', minute: '2-digit' }
                )}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-[#17241f] font-display tracking-tight leading-snug">
              {language === 'hi' ? activeItem.titleHi : activeItem.titleEn}
            </h3>

            <p className="text-xs sm:text-sm text-[#52635a] leading-relaxed">
              {language === 'hi' ? activeItem.descriptionHi : activeItem.descriptionEn}
            </p>

            {/* Quick badges for Duration, Marks, Negative Marking */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {activeItem.durationMinutes > 0 && <span className="px-2.5 py-1 rounded-lg bg-[#f6f5ee] border border-[#eceae1] text-[11px] font-bold text-[#173f35] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#52635a]" />
                {activeItem.durationMinutes} mins
              </span>}
              {activeItem.totalMarks > 0 && <span className="px-2.5 py-1 rounded-lg bg-[#f6f5ee] border border-[#eceae1] text-[11px] font-bold text-[#173f35] flex items-center gap-1">
                <Award className="w-3 h-3 text-[#52635a]" />
                {activeItem.totalMarks} Marks
              </span>}
              {activeItem.totalQuestions > 0 && <span className="px-2.5 py-1 rounded-lg bg-[#f6f5ee] border border-[#eceae1] text-[11px] font-bold text-[#173f35] flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-[#52635a]" />
                {activeItem.totalQuestions} Questions
              </span>}
              <span className="px-2.5 py-1 rounded-lg bg-[#dff4e9] border border-[#b8e6ce] text-[11px] font-bold text-[#173f35]">
                Marking: {activeItem.markingScheme}
              </span>
            </div>
          </div>

          {/* Right: Prominent Real-time Countdown Timer Digits */}
          <div className="shrink-0 flex flex-col items-center sm:items-end justify-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#52635a] mb-2">
              {language === 'hi' ? 'परीक्षा शुरू होने में शेष समय' : 'Time Remaining'}
            </span>

            <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
              {/* Days */}
              <div className="bg-[#173f35] text-white rounded-xl px-2.5 sm:px-3.5 py-2.5 sm:py-3 min-w-[58px] sm:min-w-[68px] shadow-sm border border-[#235447]">
                <div className="text-xl sm:text-2xl font-black font-display text-[#c9ed71] tracking-tight">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-extrabold uppercase text-[#b8e6ce] mt-0.5">
                  {language === 'hi' ? 'दिन' : 'Days'}
                </div>
              </div>

              {/* Hours */}
              <div className="bg-[#173f35] text-white rounded-xl px-2.5 sm:px-3.5 py-2.5 sm:py-3 min-w-[58px] sm:min-w-[68px] shadow-sm border border-[#235447]">
                <div className="text-xl sm:text-2xl font-black font-display text-[#c9ed71] tracking-tight">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-extrabold uppercase text-[#b8e6ce] mt-0.5">
                  {language === 'hi' ? 'घंटे' : 'Hours'}
                </div>
              </div>

              {/* Minutes */}
              <div className="bg-[#173f35] text-white rounded-xl px-2.5 sm:px-3.5 py-2.5 sm:py-3 min-w-[58px] sm:min-w-[68px] shadow-sm border border-[#235447]">
                <div className="text-xl sm:text-2xl font-black font-display text-[#c9ed71] tracking-tight">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-extrabold uppercase text-[#b8e6ce] mt-0.5">
                  {language === 'hi' ? 'मिनट' : 'Mins'}
                </div>
              </div>

              {/* Seconds */}
              <div className="bg-[#173f35] text-white rounded-xl px-2.5 sm:px-3.5 py-2.5 sm:py-3 min-w-[58px] sm:min-w-[68px] shadow-sm border border-[#235447]">
                <div className="text-xl sm:text-2xl font-black font-display text-[#c9ed71] tracking-tight animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-extrabold uppercase text-[#b8e6ce] mt-0.5">
                  {language === 'hi' ? 'सेकंड' : 'Secs'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar Section */}
        <div className="pt-2 border-t border-[#eceae1] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#17241f]">
              <Target className="w-3.5 h-3.5 text-[#173f35]" />
              <span>
                {language === 'hi' ? 'तैयारी विंडो प्रगति' : 'Preparation Sprint Progress'}
              </span>
            </div>
            <div className="font-extrabold text-[#173f35]">
              {progressPercent}%{' '}
              <span className="text-[#52635a] font-medium">
                ({timeLeft.days}{' '}
                {language === 'hi' ? 'दिन शेष' : 'days left'})
              </span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="relative w-full h-3 bg-[#eceae1] rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#173f35] via-[#235447] to-[#c9ed71] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Milestone markers along the timeline */}
          <div className="grid grid-cols-4 text-[10px] text-[#52635a] font-semibold pt-1">
            <div className="text-left">
              <span className="block text-[#173f35] font-bold">25%</span>
              <span className="truncate block">{language === 'hi' ? 'बुनियादी संकल्पना' : 'Concepts'}</span>
            </div>
            <div className="text-center">
              <span className="block text-[#173f35] font-bold">50%</span>
              <span className="truncate block">{language === 'hi' ? 'सेक्शनल ड्रिल' : 'Speed Drills'}</span>
            </div>
            <div className="text-center">
              <span className="block text-[#173f35] font-bold">75%</span>
              <span className="truncate block">{language === 'hi' ? 'ऑल इंडिया मॉक' : 'Full Mocks'}</span>
            </div>
            <div className="text-right">
              <span className="block text-[#173f35] font-bold">100%</span>
              <span className="truncate block">{language === 'hi' ? 'परीक्षा दिवस' : 'Exam Ready'}</span>
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#52635a] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#ef765f] shrink-0" />
            <span>
              {language === 'hi'
                ? 'नियमित मॉक टेस्ट देने से परीक्षा गति और सटीकता में 28% तक सुधार होता है।'
                : 'Consistent CBT mocks boost time management and question accuracy by up to 28%.'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Set reminder button */}
            <button
              onClick={handleSetReminder}
              disabled={reminderSaved}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                reminderSaved
                  ? 'bg-[#dff4e9] text-[#173f35] border-[#b8e6ce]'
                  : 'bg-white hover:bg-[#f6f5ee] text-[#173f35] border-[#cfcbbe]'
              }`}
            >
              {reminderSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#173f35]" />
                  <span>{language === 'hi' ? 'प्लानर में जोड़ा गया ✓' : 'Added to Tasks ✓'}</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-[#173f35]" />
                  <span>{language === 'hi' ? 'रिमाइंडर जोड़ें' : 'Set Reminder'}</span>
                </>
              )}
            </button>

            {/* Start exam / practice button */}
            {activeItem.examId ? (
              <button
                onClick={() => onStartExam(activeItem.examId!)}
                className="px-4 py-2 rounded-xl bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>{language === 'hi' ? 'मॉक टेस्ट शुरू करें' : 'Start Mock Test'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onNavigateTab('student-exams')}
                className="px-4 py-2 rounded-xl bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>{language === 'hi' ? 'टेस्ट कैटलॉग खोलें' : 'Open Test Catalog'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
