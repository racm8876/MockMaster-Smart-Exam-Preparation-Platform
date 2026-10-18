import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientExam, StudentTask, CalendarEvent, StudentGoal } from '../types';
import {
  FileQuestion,
  TrendingUp,
  Target,
  Flame,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ScheduledExamCountdown } from '../components/dashboard/ScheduledExamCountdown';

interface StudentDashboardProps {
  onStartExam: (examId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onStartExam,
  onNavigateTab,
}) => {
  const { user, token, language } = useAuth();
  const [exams, setExams] = useState<ClientExam[]>([]);
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [goal, setGoal] = useState<StudentGoal | null>(null);
  const [recentAttempt, setRecentAttempt] = useState<{
    examTitleEn: string; score: number; totalMarks: number; accuracyPercentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadPlannerTasks = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/planner', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.planner) {
        setTasks(data.planner.tasks || []);
        if (data.planner.goal) {
          setGoal(data.planner.goal);
        }
      }
    } catch {}
  };

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [examsRes, plannerRes, calRes, historyRes] = await Promise.all([
          fetch('/api/exams'),
          token ? fetch('/api/planner', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null),
          token ? fetch('/api/calendar/events', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null),
          token ? fetch('/api/attempts/history', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null),
        ]);

        const examsData = await examsRes.json();
        if (examsData.success) {
          setExams(examsData.exams);
        }

        if (plannerRes) {
          const plannerData = await plannerRes.json();
          if (plannerData.success && plannerData.planner) {
            setTasks(plannerData.planner.tasks || []);
            if (plannerData.planner.goal) {
              setGoal(plannerData.planner.goal);
            }
          }
        }

        if (calRes) {
          const calData = await calRes.json();
          if (calData.success && calData.officialEvents) {
            setEvents(calData.officialEvents);
          }
        }

        if (historyRes) {
          const historyData = await historyRes.json();
          if (historyData.success && historyData.history?.[0]) setRecentAttempt(historyData.history[0]);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [token]);

  const toggleTask = async (taskId: string, isCompleted: boolean) => {
    if (!token) return;
    try {
      await fetch(`/api/planner/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !isCompleted } : t))
      );
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#173f35] to-[#235447] text-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9ed71] text-[#173f35] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'दैनिक अभ्यास मोड सक्रिय' : 'Daily Practice Streak Active'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            {language === 'hi'
              ? `नमस्ते, ${user?.name || 'अभ्यर्थी'}!`
              : `Welcome Back, ${user?.name || 'Aspirant'}!`}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#dff4e9] leading-relaxed">
            {language === 'hi'
              ? 'आधिकारिक परीक्षा पैटर्न के अनुसार तैयार किए गए अखिल भारतीय सीबीटी मॉक टेस्ट देकर अपनी रैंक और सटीकता का परीक्षण करें।'
              : 'Benchmark your national rank and speed with authenticated CBT full-length test simulations tailored for SSC, Banking, and Railways.'}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigateTab('student-exams')}
              className="px-4 py-2 rounded-xl bg-[#c9ed71] text-[#173f35] text-xs sm:text-sm font-bold hover:bg-[#b8e25d] shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>{language === 'hi' ? 'सभी लाइव टेस्ट देखें' : 'Browse Live Mock Tests'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('student-planner')}
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs sm:text-sm font-semibold hover:bg-white/20 transition-all border border-white/20"
            >
              {language === 'hi' ? 'स्टडी प्लानर खोलें' : 'Open Study Planner'}
            </button>
          </div>
        </div>

        {/* Official Brand Seal Badge */}
        <div className="hidden md:flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-xs shrink-0 z-10 text-center">
          <ShieldCheck className="w-10 h-10 text-[#c9ed71]" />
          <span className="text-[10px] font-black uppercase tracking-wider text-[#c9ed71] mt-2">
            Verified CBT Portal
          </span>
          <span className="text-[9px] text-[#b8e6ce]">
            All-India Mock 2026
          </span>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-[-40px] bottom-[-40px] w-64 h-64 rounded-full bg-[#c9ed71]/10 pointer-events-none blur-2xl" />
      </div>

      {/* Next Scheduled Mock Exam Countdown & Visual Progress Bar */}
      <ScheduledExamCountdown
        exams={exams}
        events={events}
        goal={goal}
        onStartExam={onStartExam}
        onNavigateTab={onNavigateTab}
        onTaskAdded={reloadPlannerTasks}
      />

      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#eceae1] shadow-xs">
          <div className="flex items-center justify-between text-[#52635a]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'hi' ? 'पूर्ण टेस्ट' : 'Tests Completed'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#dff4e9] text-[#173f35] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#17241f] font-display">
              {user?.stats?.testsCompleted ?? 0}
            </span>
            <span className="text-xs text-[#52635a]">
              / {user?.stats?.testsAttempted ?? 0} attempted
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#eceae1] shadow-xs">
          <div className="flex items-center justify-between text-[#52635a]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'hi' ? 'औसत सटीकता' : 'Avg Accuracy'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#dff4e9] text-[#173f35] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#17241f] font-display">
              {`${user?.stats?.avgAccuracy ?? 0}%`}
            </span>
            <span className="text-xs text-[#52635a]">Submitted attempts</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#eceae1] shadow-xs">
          <div className="flex items-center justify-between text-[#52635a]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'hi' ? 'औसत प्राप्तांक' : 'Avg Score'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#dff4e9] text-[#173f35] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#17241f] font-display">
              {user?.stats?.avgScore ?? 0}
            </span>
            <span className="text-xs text-[#52635a]">Across completed tests</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#eceae1] shadow-xs">
          <div className="flex items-center justify-between text-[#52635a]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'hi' ? 'तैयारी अंक (Points)' : 'Aspirant Points'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ffece8] text-[#ef765f] flex items-center justify-center">
              <Flame className="w-4 h-4 fill-[#ef765f]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#17241f] font-display">
              {user?.stats?.points ?? 0}
            </span>
            <span className="text-xs text-[#ef765f] font-bold">
              🔥 {user?.stats?.streakDays ?? 0}d streak
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recommended Live Mock Exams */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-[#17241f] font-display">
                {language === 'hi' ? 'अनुशंसित लाइव टेस्ट श्रृंखला' : 'Recommended Live CBT Tests'}
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('student-exams')}
              className="text-xs font-bold text-[#173f35] hover:underline"
            >
              {language === 'hi' ? 'सभी देखें →' : 'View Catalog →'}
            </button>
          </div>

          <div className="space-y-3">
            {exams.slice(0, 3).map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl p-5 border border-[#eceae1] shadow-xs hover:border-[#cfcbbe] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#dff4e9] text-[#173f35]">
                      {language === 'hi' ? exam.categoryNameHi || 'सामान्य' : exam.categoryNameEn || 'SSC'}
                    </span>
                    <span className="text-[11px] text-[#52635a] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {exam.durationMinutes} mins
                    </span>
                    <span className="text-[11px] text-[#52635a] flex items-center gap-1">
                      <FileQuestion className="w-3 h-3" />
                      {exam.totalQuestions ?? 20} Questions
                    </span>
                    <span className="text-[11px] text-[#52635a]">
                      • {exam.totalMarks} Marks
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#17241f] font-display leading-snug">
                    {language === 'hi' ? exam.titleHi : exam.titleEn}
                  </h3>

                  <p className="text-xs text-[#52635a] line-clamp-1">
                    {language === 'hi' ? exam.descriptionHi : exam.descriptionEn}
                  </p>
                </div>

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#eceae1]">
                  <div className="text-[11px] font-semibold text-[#173f35]">
                    +2.0 / -0.5 Mark
                  </div>
                  <button
                    onClick={() => onStartExam(exam.id)}
                    className="px-4 py-2 rounded-xl bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>{language === 'hi' ? 'टेस्ट दें' : 'Start CBT Test'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {!loading && exams.length === 0 && (
              <div className="bg-white rounded-2xl p-8 border border-dashed border-[#cfcbbe] text-center text-xs text-[#52635a]">
                No published tests yet. An administrator can create and publish an exam from the admin console.
              </div>
            )}
          </div>

          {/* Quick Review of Previous Attempt */}
          {recentAttempt && <div className="bg-[#f6f5ee] rounded-2xl p-5 border border-[#eceae1] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#173f35] text-[#c9ed71] flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#173f35]">
                  {language === 'hi' ? 'हाल का प्रयास' : `Recent Attempt: ${recentAttempt.score} / ${recentAttempt.totalMarks} Marks`}
                </div>
                <div className="text-[11px] text-[#52635a]">
                  {recentAttempt.examTitleEn} • Accuracy: {recentAttempt.accuracyPercentage}%
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('student-history')}
              className="text-xs font-bold text-[#173f35] hover:underline"
            >
              {language === 'hi' ? 'समीक्षा देखें →' : 'Review Solutions →'}
            </button>
          </div>}
        </div>

        {/* Right Sidebar: Planner & Official Calendar */}
        <div className="space-y-6">
          {/* Planner Quick Tasks */}
          <div className="bg-white rounded-2xl p-5 border border-[#eceae1] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#17241f] font-display flex items-center gap-2">
                <span>{language === 'hi' ? 'दैनिक अध्ययन कार्य' : 'Study Tasks'}</span>
                <span className="text-[10px] bg-[#dff4e9] text-[#173f35] px-1.5 py-0.5 rounded font-bold">
                  {tasks.filter((t) => !t.isCompleted).length}
                </span>
              </h3>
              <button
                onClick={() => onNavigateTab('student-planner')}
                className="text-xs font-bold text-[#173f35] hover:underline"
              >
                {language === 'hi' ? 'सभी →' : 'View all →'}
              </button>
            </div>

            <div className="space-y-2">
              {tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.isCompleted)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-colors ${
                    task.isCompleted
                      ? 'bg-[#f6f5ee] border-[#eceae1] text-[#52635a] line-through'
                      : 'bg-white border-[#eceae1] hover:border-[#173f35] text-[#17241f]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    readOnly
                    className="mt-0.5 rounded accent-[#173f35]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{task.title}</p>
                    {task.dueDate && (
                      <span className="text-[10px] text-[#52635a]">Due: {task.dueDate}</span>
                    )}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-xs text-[#52635a] text-center py-2">No pending tasks for today.</p>
              )}
            </div>
          </div>

          {/* Academic Calendar Events */}
          <div className="bg-white rounded-2xl p-5 border border-[#eceae1] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#17241f] font-display flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#173f35]" />
                <span>{language === 'hi' ? 'आगामी परीक्षा तिथियां' : 'Exam Calendar'}</span>
              </h3>
            </div>

            <div className="space-y-3">
              {events.slice(0, 3).map((evt) => (
                <div key={evt.id} className="border-l-3 border-[#c9ed71] pl-3 py-1">
                  <div className="text-[11px] font-bold text-[#173f35]">{evt.date}</div>
                  <div className="text-xs font-semibold text-[#17241f] leading-snug">
                    {language === 'hi' ? evt.titleHi : evt.titleEn}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
