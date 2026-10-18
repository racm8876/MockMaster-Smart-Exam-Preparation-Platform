import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentTask, StudentStickyNote, StudentGoal } from '../types';
import {
  CalendarCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Target,
  Clock,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const StudyPlannerPage: React.FC = () => {
  const { token, language } = useAuth();
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [stickies, setStickies] = useState<StudentStickyNote[]>([]);
  const [goal, setGoal] = useState<StudentGoal | null>(null);
  const [loading, setLoading] = useState(true);

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [newTaskDue, setNewTaskDue] = useState('');

  // New sticky note form
  const [newStickyText, setNewStickyText] = useState('');
  const [newStickyColor, setNewStickyColor] = useState<'yellow' | 'mint' | 'lime' | 'coral' | 'blue'>('yellow');

  // Edit goal modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [targetExam, setTargetExam] = useState('');
  const [targetScore, setTargetScore] = useState(160);
  const [targetDate, setTargetDate] = useState('2026-12-15');
  const [dailyHours, setDailyHours] = useState(6);

  useEffect(() => {
    async function loadPlanner() {
      try {
        const res = await fetch('/api/planner', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.planner) {
          setTasks(data.planner.tasks || []);
          setStickies(data.planner.stickyNotes || []);
          if (data.planner.goal) {
            setGoal(data.planner.goal);
            setTargetExam(data.planner.goal.targetExamEn);
            setTargetScore(data.planner.goal.targetScore);
            setTargetDate(data.planner.goal.targetDate);
            setDailyHours(data.planner.goal.dailyStudyHours);
          }
        }
      } catch (err) {
        console.error('Failed to load planner', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlanner();
  }, [token]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !token) return;

    try {
      const res = await fetch('/api/planner/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          priority: newTaskPriority,
          dueDate: newTaskDue || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => [...prev, data.task]);
        setNewTaskTitle('');
        setNewTaskDue('');
      }
    } catch {}
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      await fetch(`/api/planner/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !currentStatus } : t))
      );
    } catch {}
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/planner/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {}
  };

  const handleAddSticky = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStickyText.trim() || !token) return;

    try {
      const res = await fetch('/api/planner/stickies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newStickyText,
          color: newStickyColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStickies((prev) => [...prev, data.stickyNote]);
        setNewStickyText('');
      }
    } catch {}
  };

  const handleDeleteSticky = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/planner/stickies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setStickies((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  const handleSaveGoal = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/planner/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetExamEn: targetExam,
          targetScore,
          targetDate,
          dailyStudyHours: dailyHours,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGoal(data.goal);
        setShowGoalModal(false);
      }
    } catch {}
  };

  const getStickyBg = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'bg-[#fff9db] border-[#ffec99] text-[#493400]';
      case 'mint':
        return 'bg-[#dff4e9] border-[#b8e6ce] text-[#0f2c25]';
      case 'lime':
        return 'bg-[#eef8cf] border-[#c9ed71] text-[#173f35]';
      case 'coral':
        return 'bg-[#ffece8] border-[#ef765f]/30 text-[#832616]';
      case 'blue':
        return 'bg-[#e7f5ff] border-[#a5d8ff] text-[#1864ab]';
      default:
        return 'bg-[#fff9db] border-[#ffec99] text-[#493400]';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3.5 bg-white p-5 rounded-2xl border border-[#eceae1] shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-[#dff4e9] text-[#173f35] flex items-center justify-center shrink-0 border border-[#b8e6ce]">
          <CalendarCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17241f] font-display">
            {language === 'hi' ? 'स्मार्ट अध्ययन योजनाकार एवं लक्ष्य' : 'Aspirant Study Planner & Mission Board'}
          </h1>
          <p className="mt-0.5 text-xs text-[#52635a]">
            {language === 'hi'
              ? 'दैनिक अध्ययन कार्य, लक्ष्य और महत्वपूर्ण ट्रिक्स के लिए आपका व्यक्तिगत बोर्ड।'
              : 'Track daily revision checklists, target scores, and sticky strategy memos.'}
          </p>
        </div>
      </div>

      {/* Goal Tracker Card */}
      <div className="bg-gradient-to-r from-[#173f35] to-[#235447] text-white p-6 rounded-2xl border border-[#235447] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9ed71] text-[#173f35] text-xs font-bold">
            <Target className="w-3.5 h-3.5" />
            <span>PRIMARY EXAMINATION MISSION</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display text-white">
            {goal?.targetExamEn || 'SSC CGL Tier 1 & Tier 2 2026'}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[#dff4e9]">
            <span>🎯 Target Score: <strong className="text-[#c9ed71] text-sm">{goal?.targetScore ?? 160} / 200</strong></span>
            <span>📅 Exam Date: <strong>{goal?.targetDate || 'Dec 2026'}</strong></span>
            <span>⏱️ Daily Hours: <strong>{goal?.dailyStudyHours ?? 6} hrs/day</strong></span>
          </div>
        </div>

        <button
          onClick={() => setShowGoalModal(true)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Target Goal</span>
        </button>
      </div>

      {/* Two Column Layout: Tasks & Sticky Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Study Tasks Checklist */}
        <div className="bg-white rounded-2xl p-6 border border-[#eceae1] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#17241f] font-display flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#173f35]" />
              <span>Daily Revision & Practice Checklist</span>
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#dff4e9] text-[#173f35]">
              {tasks.filter((t) => t.isCompleted).length} / {tasks.length} Completed
            </span>
          </div>

          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Solve 20 questions of Mensuration..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#cfcbbe] focus:outline-none focus:ring-2 focus:ring-[#173f35]"
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as any)}
              className="px-2 py-2 text-xs rounded-xl border border-[#cfcbbe] bg-[#f6f5ee] font-bold text-[#173f35]"
            >
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <button
              type="submit"
              className="p-2 rounded-xl bg-[#173f35] text-[#c9ed71] hover:bg-[#235447] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Task list */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                  task.isCompleted
                    ? 'bg-[#f6f5ee] border-[#eceae1] text-[#52635a] line-through'
                    : 'bg-white border-[#eceae1] hover:border-[#173f35] text-[#17241f]'
                }`}
              >
                <div
                  onClick={() => handleToggleTask(task.id, task.isCompleted)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    readOnly
                    className="rounded accent-[#173f35] w-4 h-4"
                  />
                  <div className="min-w-0">
                    <span className="font-semibold block truncate">{task.title}</span>
                    {task.dueDate && (
                      <span className="text-[10px] text-[#52635a]">Due: {task.dueDate}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                      task.priority === 'HIGH'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {task.priority}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 text-[#52635a] hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-xs text-[#52635a] text-center py-6">No tasks added yet. Create your first study task above!</p>
            )}
          </div>
        </div>

        {/* Right: Sticky Strategy Memos */}
        <div className="bg-white rounded-2xl p-6 border border-[#eceae1] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#17241f] font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ef765f]" />
              <span>Sticky Strategy Memos & Shortcuts</span>
            </h3>
          </div>

          {/* Add Sticky Note */}
          <form onSubmit={handleAddSticky} className="space-y-2">
            <textarea
              rows={2}
              value={newStickyText}
              onChange={(e) => setNewStickyText(e.target.value)}
              placeholder="Jot down a quick shortcut, formula reminder, or exam tip..."
              className="w-full p-2.5 text-xs rounded-xl border border-[#cfcbbe] focus:outline-none focus:ring-2 focus:ring-[#173f35]"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {(['yellow', 'mint', 'lime', 'coral', 'blue'] as const).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewStickyColor(col)}
                    className={`w-5 h-5 rounded-full border ${
                      newStickyColor === col ? 'ring-2 ring-[#173f35]' : ''
                    } ${
                      col === 'yellow'
                        ? 'bg-[#fff3bf]'
                        : col === 'mint'
                        ? 'bg-[#dff4e9]'
                        : col === 'lime'
                        ? 'bg-[#c9ed71]'
                        : col === 'coral'
                        ? 'bg-[#ffece8]'
                        : 'bg-[#e7f5ff]'
                    }`}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-[#173f35] text-[#c9ed71] hover:bg-[#235447] text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pin Sticky</span>
              </button>
            </div>
          </form>

          {/* Sticky Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
            {stickies.map((stk) => (
              <div
                key={stk.id}
                className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between space-y-2 relative group ${getStickyBg(
                  stk.color
                )}`}
              >
                <p className="text-xs font-medium leading-relaxed">{stk.content}</p>
                <div className="flex items-center justify-between text-[10px] opacity-75">
                  <span>Pinned note</span>
                  <button
                    onClick={() => handleDeleteSticky(stk.id)}
                    className="p-1 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Target Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#eceae1]">
            <h3 className="font-extrabold text-lg text-[#17241f] font-display">Configure Target Examination</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#17241f] block mb-1">Target Exam Name</label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>

              <div>
                <label className="font-bold text-[#17241f] block mb-1">Target Score Marks</label>
                <input
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>

              <div>
                <label className="font-bold text-[#17241f] block mb-1">Target Examination Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>

              <div>
                <label className="font-bold text-[#17241f] block mb-1">Daily Study Target (Hours)</label>
                <input
                  type="number"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eceae1]">
              <button
                onClick={() => setShowGoalModal(false)}
                className="px-4 py-2 rounded-xl border border-[#cfcbbe] text-xs font-bold text-[#52635a]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                className="px-4 py-2 rounded-xl bg-[#173f35] text-[#c9ed71] text-xs font-bold"
              >
                Save Target Mission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
