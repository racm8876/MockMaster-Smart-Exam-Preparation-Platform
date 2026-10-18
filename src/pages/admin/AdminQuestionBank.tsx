import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Question, Category, Subject, Topic } from '../../types';
import { MathText } from '../../components/common/MathText';
import {
  Database,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
} from 'lucide-react';

export const AdminQuestionBank: React.FC = () => {
  const { token, language } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [taxonomy, setTaxonomy] = useState<{ categories: Category[]; subjects: Subject[]; topics: Topic[] }>({
    categories: [],
    subjects: [],
    topics: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  // Add question modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: '',
    topicId: '',
    difficulty: 'MEDIUM',
    textEn: '',
    textHi: '',
    positiveMarks: 2.0,
    negativeMarks: 0.5,
    options: [
      { textEn: '', textHi: '' },
      { textEn: '', textHi: '' },
      { textEn: '', textHi: '' },
      { textEn: '', textHi: '' },
    ],
    correctOptionIndex: 0,
    explanationEn: '',
    explanationHi: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [qRes, taxRes] = await Promise.all([
          fetch('/api/admin/questions', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/taxonomy', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const qData = await qRes.json();
        const taxData = await taxRes.json();

        if (qData.success) setQuestions(qData.questions);
        if (taxData.success) {
          setTaxonomy({
            categories: taxData.categories || [],
            subjects: taxData.subjects || [],
            topics: taxData.topics || [],
          });
        }
      } catch (err) {
        console.error('Failed to load question bank data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.textEn.trim() || !token) return;

    const options = formData.options.map((opt, idx) => ({
      id: `opt-${Date.now()}-${idx}`,
      textEn: opt.textEn || `Option ${idx + 1}`,
      textHi: opt.textHi || opt.textEn || `विकल्प ${idx + 1}`,
    }));

    const correctOptionId = options[formData.correctOptionIndex]?.id || options[0].id;

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId: formData.subjectId,
          topicId: formData.topicId,
          difficulty: formData.difficulty,
          textEn: formData.textEn,
          textHi: formData.textHi || formData.textEn,
          positiveMarks: Number(formData.positiveMarks),
          negativeMarks: Number(formData.negativeMarks),
          options,
          correctOptionId,
          explanationEn: formData.explanationEn,
          explanationHi: formData.explanationHi || formData.explanationEn,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQuestions((prev) => [data.question, ...prev]);
        setShowAddModal(false);
        setFormData({
          subjectId: '',
          topicId: '',
          difficulty: 'MEDIUM',
          textEn: '',
          textHi: '',
          positiveMarks: 2.0,
          negativeMarks: 0.5,
          options: [
            { textEn: '', textHi: '' },
            { textEn: '', textHi: '' },
            { textEn: '', textHi: '' },
            { textEn: '', textHi: '' },
          ],
          correctOptionIndex: 0,
          explanationEn: '',
          explanationHi: '',
        });
      } else {
        alert(data.error || 'Failed to create question.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      } else {
        alert(data.error || 'Cannot delete question.');
      }
    } catch {}
  };

  const filteredQuestions = questions.filter((q) => {
    const matchSearch =
      !search ||
      q.textEn.toLowerCase().includes(search.toLowerCase()) ||
      q.textHi.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !selectedSubject || q.subjectId === selectedSubject;
    const matchDiff = !selectedDifficulty || q.difficulty === selectedDifficulty;
    return matchSearch && matchSubject && matchDiff;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#eceae1] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#dff4e9] text-[#173f35] flex items-center justify-center shrink-0 border border-[#b8e6ce]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#17241f] font-display">
              {language === 'hi' ? 'द्विभाषी प्रश्न बैंक एवं विषय वर्गीकरण' : 'Bilingual Question Bank & Taxonomy'}
            </h1>
            <p className="mt-0.5 text-xs text-[#52635a]">
              Curate mathematical equations, diagrams, and bilingual explanations for CBT exams.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#eceae1] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#52635a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by keywords or formula..."
            className="w-full text-xs outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="p-1.5 rounded-lg border border-[#cfcbbe] text-xs font-semibold text-[#173f35]"
          >
            <option value="">All Subjects</option>
            {taxonomy.subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.nameEn}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="p-1.5 rounded-lg border border-[#cfcbbe] text-xs font-semibold text-[#173f35]"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {filteredQuestions.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl p-5 border border-[#eceae1] shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-[#173f35]">Q{idx + 1}.</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-[#dff4e9] text-[#173f35]">
                  {q.difficulty}
                </span>
                <span className="text-[11px] text-[#52635a]">
                  +{q.positiveMarks} / -{q.negativeMarks} Marks
                </span>
              </div>

              <button
                onClick={() => handleDeleteQuestion(q.id)}
                className="p-1.5 rounded-lg text-[#52635a] hover:text-red-600 transition-colors"
                title="Delete question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Bilingual Text Preview */}
            <div className="space-y-1.5 text-xs sm:text-sm text-[#17241f] leading-relaxed">
              <div className="font-medium">
                <MathText content={q.textEn} />
              </div>
              <div className="text-[#52635a] text-xs">
                <MathText content={q.textHi} />
              </div>
            </div>

            {/* 4 Options Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {q.options.map((opt: any, oIdx: number) => {
                const isCorrect = opt.id === q.correctOptionId;
                const letter = ['A', 'B', 'C', 'D'][oIdx] || '•';
                return (
                  <div
                    key={opt.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950'
                        : 'bg-[#f6f5ee] border-[#eceae1] text-[#17241f]'
                    }`}
                  >
                    <span className="truncate">
                      <strong>{letter}.</strong> {opt.textEn}
                    </span>
                    {isCorrect && (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-300">
                        Correct
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation snippet */}
            <div className="text-[11px] text-[#52635a] pt-1 border-t border-[#eceae1]">
              <strong>Solution:</strong> {q.explanationEn.slice(0, 100)}...
            </div>
          </div>
        ))}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-[#eceae1] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceae1]">
              <h3 className="font-extrabold text-base text-[#173f35] font-display">
                Create Bilingual Question
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#52635a]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#17241f] block mb-1">Subject</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#cfcbbe]"
                  >
                    <option value="">Select subject</option>
                    {taxonomy.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#17241f] block mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#cfcbbe]"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#17241f] block mb-1">Marking (+ / -)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.5"
                      value={formData.positiveMarks}
                      onChange={(e) => setFormData({ ...formData, positiveMarks: Number(e.target.value) })}
                      className="w-1/2 p-2 rounded-xl border border-[#cfcbbe]"
                    />
                    <input
                      type="number"
                      step="0.25"
                      value={formData.negativeMarks}
                      onChange={(e) => setFormData({ ...formData, negativeMarks: Number(e.target.value) })}
                      className="w-1/2 p-2 rounded-xl border border-[#cfcbbe]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#17241f] block mb-1">Question Text (English with LaTeX)</label>
                <textarea
                  rows={2}
                  required
                  value={formData.textEn}
                  onChange={(e) => setFormData({ ...formData, textEn: e.target.value })}
                  placeholder="e.g. Find the value of $x^2 + 5x = 24$..."
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>

              <div>
                <label className="font-bold text-[#17241f] block mb-1">Question Text (Hindi - optional)</label>
                <textarea
                  rows={2}
                  value={formData.textHi}
                  onChange={(e) => setFormData({ ...formData, textHi: e.target.value })}
                  placeholder="हिंदी में प्रश्न दर्ज करें..."
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <label className="font-bold text-[#17241f] block">
                  Four Single-Choice Options (Select radio for correct answer)
                </label>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={formData.correctOptionIndex === idx}
                      onChange={() => setFormData({ ...formData, correctOptionIndex: idx })}
                      className="w-4 h-4 accent-[#173f35]"
                    />
                    <span className="font-bold w-4">{['A', 'B', 'C', 'D'][idx]}.</span>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${['A', 'B', 'C', 'D'][idx]} text`}
                      value={opt.textEn}
                      onChange={(e) => {
                        const newOpts = [...formData.options];
                        newOpts[idx].textEn = e.target.value;
                        newOpts[idx].textHi = e.target.value;
                        setFormData({ ...formData, options: newOpts });
                      }}
                      className="flex-1 p-2 rounded-xl border border-[#cfcbbe]"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="font-bold text-[#17241f] block mb-1">Detailed Solution & Explanation</label>
                <textarea
                  rows={2}
                  value={formData.explanationEn}
                  onChange={(e) => setFormData({ ...formData, explanationEn: e.target.value })}
                  placeholder="Step-by-step formula derivation..."
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#eceae1]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#cfcbbe] font-bold text-[#52635a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#173f35] text-[#c9ed71] font-bold"
                >
                  Save to Question Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
