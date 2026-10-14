import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  FileQuestion,
  Users,
  Target,
  Clock,
  Layers,
  HelpCircle,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const { token, language } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'exams' | 'sections' | 'questions' | 'students' | 'live'
  >('exams');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setAnalytics(data.analytics);
        }
      } catch (err) {
        console.error('Failed to load admin analytics', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="py-20 text-center text-[#52635a]">
        <div className="w-10 h-10 border-4 border-[#173f35] border-t-[#c9ed71] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-[#173f35]">Aggregating Authoritative Examination Metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17241f] font-display">
          {language === 'hi' ? 'गहन परीक्षा सांख्यिकी एवं विश्लेषण' : '5-Dimensional Institutional Analytics'}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#52635a]">
          Authoritative intelligence derived from server-locked submissions, question response distributions, and sectional mastery.
        </p>
      </div>

      {/* 5 View Switcher Tabs */}
      <div className="flex border-b border-[#eceae1] overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('exams')}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'exams'
              ? 'border-[#173f35] text-[#173f35] bg-white'
              : 'border-transparent text-[#52635a] hover:text-[#173f35]'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          <span>1. Per-Exam Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'sections'
              ? 'border-[#173f35] text-[#173f35] bg-white'
              : 'border-transparent text-[#52635a] hover:text-[#173f35]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Section Performance</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'questions'
              ? 'border-[#173f35] text-[#173f35] bg-white'
              : 'border-transparent text-[#52635a] hover:text-[#173f35]'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>3. Question Difficulty & Accuracy</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'students'
              ? 'border-[#173f35] text-[#173f35] bg-white'
              : 'border-transparent text-[#52635a] hover:text-[#173f35]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. Student Performance Drilldown</span>
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'live'
              ? 'border-[#173f35] text-[#173f35] bg-white'
              : 'border-transparent text-[#52635a] hover:text-[#173f35]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>5. Live CBT Attempt Monitor</span>
        </button>
      </div>

      {/* VIEW 1: PER-EXAM METRICS */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-2xl border border-[#eceae1] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#eceae1]">
            <h3 className="font-extrabold text-base text-[#17241f] font-display">
              Examination Performance Overview
            </h3>
            <p className="text-xs text-[#52635a]">Aggregated attempts, scores, and completion distribution.</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f5ee] text-[#52635a] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Test Title</th>
                <th className="py-3 px-4">Total Submissions</th>
                <th className="py-3 px-4">Average Score</th>
                <th className="py-3 px-4">Max Score</th>
                <th className="py-3 px-6 text-right">Pass / Mastery Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceae1] text-[#17241f]">
              {(analytics?.examMetrics || []).map((ex: any) => (
                <tr key={ex.examId} className="hover:bg-[#f6f5ee]/50">
                  <td className="py-4 px-6 font-bold text-xs sm:text-sm text-[#173f35]">
                    {ex.titleEn}
                  </td>
                  <td className="py-4 px-4 font-semibold">{ex.totalAttempts}</td>
                  <td className="py-4 px-4 font-black font-display text-sm text-[#173f35]">
                    {ex.avgScore} <span className="text-xs text-[#52635a]">/ {ex.totalMarks}</span>
                  </td>
                  <td className="py-4 px-4 font-bold text-emerald-700">{ex.maxScore} marks</td>
                  <td className="py-4 px-6 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dff4e9] text-[#173f35]">
                      High Engagement
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: SECTION PERFORMANCE BREAKDOWN */}
      {activeTab === 'sections' && (
        <div className="bg-white rounded-2xl p-6 border border-[#eceae1] shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-[#17241f] font-display">
              Section-Level Mastery Comparison
            </h3>
            <p className="text-xs text-[#52635a]">Compare student scoring efficiency across reasoning, quant, GK, and language.</p>
          </div>

          <div className="space-y-4 pt-2">
            {(analytics?.sectionAnalysis || []).map((sec: any, idx: number) => (
              <div key={idx} className="p-4 bg-[#f6f5ee] rounded-xl border border-[#eceae1] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#17241f] text-sm">{sec.sectionName}</span>
                  <span className="text-[#173f35] font-display text-base">
                    {sec.avgScore} / {sec.maxMarks} marks ({sec.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#cfcbbe] rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[#173f35] h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, sec.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: QUESTION-LEVEL DIFFICULTY & ACCURACY */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-2xl border border-[#eceae1] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#eceae1]">
            <h3 className="font-extrabold text-base text-[#17241f] font-display">
              Question Accuracy & Difficulty Analysis
            </h3>
            <p className="text-xs text-[#52635a]">Identifies tricky questions, negative marking traps, and high-scoring items.</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f5ee] text-[#52635a] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Question Preview</th>
                <th className="py-3 px-4">Configured Difficulty</th>
                <th className="py-3 px-4">Times Answered</th>
                <th className="py-3 px-6 text-right">Student Accuracy %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceae1] text-[#17241f]">
              {(analytics?.questionAnalysis || []).map((q: any) => (
                <tr key={q.questionId} className="hover:bg-[#f6f5ee]/50">
                  <td className="py-3 px-6 font-medium max-w-xs truncate">{q.textSnippet}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        q.difficulty === 'HARD'
                          ? 'bg-red-100 text-red-800'
                          : q.difficulty === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="py-3 px-4">{q.timesAttempted} attempts</td>
                  <td className="py-3 px-6 text-right font-black font-display text-sm text-[#173f35]">
                    {q.accuracyPercentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 4: STUDENT DRILLDOWN */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-[#eceae1] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#eceae1]">
            <h3 className="font-extrabold text-base text-[#17241f] font-display">
              Student Merit & Preparation Records
            </h3>
            <p className="text-xs text-[#52635a]">Drill into individual performance records and points standings.</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f5ee] text-[#52635a] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Candidate Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Tests Completed</th>
                <th className="py-3 px-4">Avg Score</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-6 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceae1] text-[#17241f]">
              {(analytics?.studentRankings || []).map((s: any) => (
                <tr key={s.id} className="hover:bg-[#f6f5ee]/50">
                  <td className="py-3.5 px-6 font-bold text-[#17241f]">{s.name}</td>
                  <td className="py-3.5 px-4 text-[#52635a]">{s.email}</td>
                  <td className="py-3.5 px-4 font-semibold">{s.testsCompleted}</td>
                  <td className="py-3.5 px-4 font-black text-[#173f35]">{s.avgScore}m</td>
                  <td className="py-3.5 px-4 text-emerald-700 font-bold">{s.avgAccuracy}%</td>
                  <td className="py-3.5 px-6 text-right font-black text-[#ef765f] font-display">
                    {s.points} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 5: LIVE CBT ATTEMPT MONITOR */}
      {activeTab === 'live' && (
        <div className="bg-white rounded-2xl p-6 border border-[#eceae1] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-[#17241f] font-display flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Active CBT Exam Attempts</span>
              </h3>
              <p className="text-xs text-[#52635a]">Real-time monitoring of students currently taking timed tests.</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#dff4e9] text-[#173f35]">
              {(analytics?.inProgressAttempts || []).length} In-Progress Session
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {(analytics?.inProgressAttempts || []).map((att: any) => (
              <div key={att.attemptId} className="p-4 bg-[#f6f5ee] rounded-xl border border-[#eceae1] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#17241f]">{att.studentName}</h4>
                  <div className="text-[11px] text-[#52635a]">
                    Exam: <strong>{att.examTitle}</strong> • Started at {new Date(att.startedAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-[#173f35] bg-white px-2 py-1 rounded-lg border border-[#cfcbbe]">
                    {att.questionsAnswered} Questions Answered
                  </span>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1">Live timer ticking</div>
                </div>
              </div>
            ))}
            {(!analytics?.inProgressAttempts || analytics.inProgressAttempts.length === 0) && (
              <p className="text-xs text-[#52635a] py-8 text-center">No active student attempts currently in progress.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
