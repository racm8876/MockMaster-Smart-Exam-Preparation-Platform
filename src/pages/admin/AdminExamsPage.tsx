import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Exam } from '../../types';
import {
  FileQuestion,
  Plus,
  Copy,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Clock,
  Layers,
  Settings,
  AlertCircle,
  X,
} from 'lucide-react';

interface AdminExamsPageProps {
  onPreviewExam: (examId: string) => void;
}

export const AdminExamsPage: React.FC<AdminExamsPageProps> = ({ onPreviewExam }) => {
  const { token, language } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Create exam modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [totalMarks, setTotalMarks] = useState(40);

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch('/api/admin/exams', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setExams(data.exams);
        }
      } catch (err) {
        console.error('Failed to load exams', err);
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, [token]);

  const handlePublishToggle = async (examId: string, currentStatus: boolean) => {
    const endpoint = currentStatus ? `/api/admin/exams/${examId}/unpublish` : `/api/admin/exams/${examId}/publish`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setExams((prev) =>
          prev.map((e) => (e.id === examId ? { ...e, isPublished: !currentStatus } : e))
        );
      } else {
        alert(data.error || 'Validation error while publishing exam.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDuplicate = async (examId: string) => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setExams((prev) => [data.exam, ...prev]);
        alert('Created draft duplicate copy with isolated question references.');
      }
    } catch {}
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() || !token) return;

    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titleEn,
          titleHi: titleHi || titleEn,
          durationMinutes,
          totalMarks,
          sections: [
            {
              id: `sec-${Date.now()}`,
              nameEn: 'General Section 1',
              nameHi: 'सामान्य अनुभाग 1',
              order: 1,
              questionIds: ['q-res-01', 'q-res-02', 'q-res-03', 'q-res-04', 'q-res-05'],
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExams((prev) => [data.exam, ...prev]);
        setShowCreateModal(false);
        setTitleEn('');
        setTitleHi('');
      }
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17241f] font-display">
            {language === 'hi' ? 'परीक्षा रचना एवं प्रकाशन प्रबंधन' : 'Exam Authoring & Publishing Manager'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#52635a]">
            Compose sectional structures, enforce attempt limits, and validate publication criteria.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam</span>
        </button>
      </div>

      {/* Exam List Cards */}
      <div className="space-y-4">
        {exams.map((exam) => {
          const totalQ = (exam.sections || []).reduce((sum: number, s: any) => sum + (s.questionIds?.length || 0), 0);

          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl p-6 border border-[#eceae1] shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        exam.isPublished
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {exam.isPublished ? 'Live & Published' : 'Draft / Unpublished'}
                    </span>
                    <span className="text-[11px] text-[#52635a]">• ID: {exam.id}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#17241f] font-display">
                    {exam.titleEn}
                  </h3>
                  <p className="text-xs text-[#52635a]">{exam.titleHi}</p>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePublishToggle(exam.id, exam.isPublished)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      exam.isPublished
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {exam.isPublished ? 'Unpublish' : 'Publish Live'}
                  </button>

                  <button
                    onClick={() => handleDuplicate(exam.id)}
                    className="p-2 rounded-xl border border-[#cfcbbe] hover:bg-[#f6f5ee] text-[#173f35] transition-colors"
                    title="Duplicate Exam (History-safe)"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onPreviewExam(exam.id)}
                    className="p-2 rounded-xl border border-[#cfcbbe] hover:bg-[#f6f5ee] text-[#173f35] transition-colors"
                    title="Student Preview Mode"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sections Breakdown & Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#f6f5ee] rounded-xl border border-[#eceae1] text-xs">
                <div>
                  <span className="text-[#52635a] block text-[10px]">Duration</span>
                  <span className="font-bold text-[#17241f]">{exam.durationMinutes} mins</span>
                </div>
                <div>
                  <span className="text-[#52635a] block text-[10px]">Total Marks</span>
                  <span className="font-bold text-[#17241f]">{exam.totalMarks} Marks</span>
                </div>
                <div>
                  <span className="text-[#52635a] block text-[10px]">Questions</span>
                  <span className="font-bold text-[#17241f]">{totalQ} Questions</span>
                </div>
                <div>
                  <span className="text-[#52635a] block text-[10px]">Sections</span>
                  <span className="font-bold text-[#17241f]">{exam.sections.length} Sections</span>
                </div>
              </div>

              {/* Section pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(exam.sections || []).map((sec: any, sIdx: number) => (
                  <span
                    key={sec.id}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#cfcbbe] text-[11px] font-semibold text-[#173f35]"
                  >
                    {sIdx + 1}. {sec.nameEn} ({sec.questionIds?.length || 0} Qs)
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create New Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#eceae1]">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceae1]">
              <h3 className="font-extrabold text-base text-[#173f35] font-display">
                Create Examination Draft
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#52635a]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#17241f] block mb-1">Exam Title (English)</label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. SSC CGL Tier 1 Full Mock 02"
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>

              <div>
                <label className="font-bold text-[#17241f] block mb-1">Exam Title (Hindi)</label>
                <input
                  type="text"
                  value={titleHi}
                  onChange={(e) => setTitleHi(e.target.value)}
                  placeholder="e.g. एसएससी सीजीएल टियर 1 संपूर्ण मॉक 02"
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#17241f] block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#17241f] block mb-1">Total Maximum Marks</label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#eceae1]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#cfcbbe] font-bold text-[#52635a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#173f35] text-[#c9ed71] font-bold"
                >
                  Create Draft Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
