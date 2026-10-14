import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  FileQuestion,
  Database,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { token, language } = useAuth();
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKpis() {
      try {
        const res = await fetch('/api/admin/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setKpis(data.kpis);
        }
      } catch (err) {
        console.error('Failed to load admin KPIs', err);
      } finally {
        setLoading(false);
      }
    }
    loadKpis();
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Admin Welcome Banner */}
      <div className="bg-gradient-to-r from-[#173f35] to-[#0f2c25] text-white p-6 rounded-2xl border border-[#235447] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#c9ed71] bg-white/10 px-2.5 py-0.5 rounded-full">
            Chief Administrator Control Deck
          </span>
          <h1 className="text-xl sm:text-2xl font-black font-display text-white">
            {language === 'hi' ? 'परीक्षा संचालन एवं विश्लेषण केंद्र' : 'MockMaster Exam Operation Center'}
          </h1>
          <p className="text-xs text-[#dff4e9]">
            Manage bilingual question banks, configure exams, verify import drafts, and monitor student metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('admin-exams')}
            className="px-4 py-2 rounded-xl bg-[#c9ed71] hover:bg-[#b8e25d] text-[#173f35] font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <FileQuestion className="w-4 h-4" />
            <span>Manage Exams</span>
          </button>
          <button
            onClick={() => onNavigateTab('admin-import')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Paper</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#eceae1] shadow-xs">
          <span className="text-xs font-bold text-[#52635a] uppercase tracking-wider">Registered Aspirants</span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#17241f] font-display">
            {kpis?.totalStudents ?? 4}
          </div>
          <span className="text-xs text-emerald-700 font-semibold">Active accounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceae1] shadow-xs">
          <span className="text-xs font-bold text-[#52635a] uppercase tracking-wider">Published Exams</span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#17241f] font-display">
            {kpis?.activeExams ?? 2}
          </div>
          <span className="text-xs text-[#173f35] font-semibold">Live in CBT catalog</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceae1] shadow-xs">
          <span className="text-xs font-bold text-[#52635a] uppercase tracking-wider">Question Bank</span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#17241f] font-display">
            {kpis?.totalQuestions ?? 20}
          </div>
          <span className="text-xs text-[#52635a]">Bilingual (EN + HI)</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceae1] shadow-xs">
          <span className="text-xs font-bold text-[#52635a] uppercase tracking-wider">Total Submissions</span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#17241f] font-display">
            {kpis?.totalAttempts ?? 1}
          </div>
          <span className="text-xs text-emerald-700 font-semibold">Avg Score: {kpis?.avgScore ?? 34.0}m</span>
        </div>
      </div>

      {/* Two Column Layout: Quick Actions & Recent Exam Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#eceae1] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#17241f] font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#173f35]" />
              <span>Recent Student Examination Submissions</span>
            </h2>
            <button
              onClick={() => onNavigateTab('admin-analytics')}
              className="text-xs font-bold text-[#173f35] hover:underline"
            >
              View Analytics →
            </button>
          </div>

          <div className="divide-y divide-[#eceae1]">
            {(kpis?.recentAttempts || []).map((att: any) => (
              <div key={att.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#17241f]">
                    {att.studentName}
                  </h4>
                  <div className="text-[11px] text-[#52635a] flex items-center gap-2">
                    <span>{att.examTitle}</span>
                    <span>•</span>
                    <span>{new Date(att.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-sm text-[#173f35] font-display">
                    {att.score?.toFixed(1)} <span className="text-[10px] text-[#52635a]">/ {att.totalMarks}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700">
                    Accuracy: {att.accuracy}%
                  </span>
                </div>
              </div>
            ))}
            {(!kpis?.recentAttempts || kpis.recentAttempts.length === 0) && (
              <p className="text-xs text-[#52635a] py-6 text-center">No recent test submissions recorded.</p>
            )}
          </div>
        </div>

        {/* Right: Administrative Tools Shortcuts */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#eceae1] shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#17241f] font-display">Administrative Shortcuts</h3>

            <div className="space-y-2">
              <button
                onClick={() => onNavigateTab('admin-questions')}
                className="w-full p-2.5 rounded-xl border border-[#eceae1] hover:bg-[#f6f5ee] text-left text-xs font-bold text-[#173f35] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-[#173f35]" />
                  <span>Question Bank & Formulas</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#52635a]" />
              </button>

              <button
                onClick={() => onNavigateTab('admin-import')}
                className="w-full p-2.5 rounded-xl border border-[#eceae1] hover:bg-[#f6f5ee] text-left text-xs font-bold text-[#173f35] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#ef765f]" />
                  <span>Import Paper (Text/CSV/JSON)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#52635a]" />
              </button>

              <button
                onClick={() => onNavigateTab('admin-analytics')}
                className="w-full p-2.5 rounded-xl border border-[#eceae1] hover:bg-[#f6f5ee] text-left text-xs font-bold text-[#173f35] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-[#173f35]" />
                  <span>5-Metric Deep Analytics</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#52635a]" />
              </button>

              <button
                onClick={() => onNavigateTab('admin-students')}
                className="w-full p-2.5 rounded-xl border border-[#eceae1] hover:bg-[#f6f5ee] text-left text-xs font-bold text-[#173f35] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#173f35]" />
                  <span>Manage Students & Access</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#52635a]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
