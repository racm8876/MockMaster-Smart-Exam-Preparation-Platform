import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import { Users, Search, AlertCircle, LoaderCircle } from 'lucide-react';

export const AdminStudentsPage: React.FC = () => {
  const { token, language } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Unable to load student records.');
        setStudents(data.users);
      } catch (err) {
        console.error('Failed to load students', err);
        setError(err instanceof Error ? err.message : 'Unable to load student records.');
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, [token]);

  const handleSetStatus = async (student: UserProfile) => {
    const isActivating = !student.isActive;
    if (!isActivating && !window.confirm(`Suspend ${student.name}? They will be signed out immediately and cannot access their account until reactivated.`)) {
      return;
    }
    setError(null);
    setUpdatingUserId(student.id);
    try {
      const res = await fetch(`/api/admin/users/${student.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: isActivating }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, isActive: data.isActive } : s))
        );
      } else {
        setError(data.error || 'Failed to update user status.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3.5 bg-white p-5 rounded-2xl border border-[#eceae1] shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-[#dff4e9] text-[#173f35] flex items-center justify-center shrink-0 border border-[#b8e6ce]">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17241f] font-display">
            {language === 'hi' ? 'अभ्यर्थी प्रबंधन एवं अभिलेख' : 'Student Database & Access Control'}
          </h1>
          <p className="mt-0.5 text-xs text-[#52635a]">
            Monitor student enrollment, evaluate completion metrics, and control account active/suspended status.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 border border-[#eceae1] shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-[#52635a]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name or email..."
          className="w-full text-xs outline-none"
        />
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-[#eceae1] shadow-xs overflow-hidden">
        {error && <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f6f5ee] border-b border-[#eceae1] text-[#52635a] uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-6">Student Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Tests Completed</th>
              <th className="py-3 px-4">Avg Accuracy</th>
              <th className="py-3 px-4">Points</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-6 text-right">Access Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceae1] text-[#17241f]">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-[#f6f5ee]/50 transition-colors">
                <td className="py-4 px-6 font-bold text-xs sm:text-sm text-[#173f35] flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#173f35] text-white flex items-center justify-center font-bold text-xs uppercase">
                    {s.name.charAt(0)}
                  </div>
                  <span>{s.name}</span>
                </td>
                <td className="py-4 px-4 text-[#52635a]">{s.email}</td>
                <td className="py-4 px-4 font-semibold">{s.stats?.testsCompleted ?? 0}</td>
                <td className="py-4 px-4 text-emerald-700 font-bold">{s.stats?.avgAccuracy ?? 0}%</td>
                <td className="py-4 px-4 font-black text-[#173f35]">{s.stats?.points ?? 0} pts</td>
                <td className="py-4 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {s.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    type="button"
                    disabled={updatingUserId === s.id}
                    onClick={() => handleSetStatus(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-60 ${
                      s.isActive
                        ? 'border border-red-200 text-red-600 hover:bg-red-50'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {updatingUserId === s.id ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : (s.isActive ? 'Deactivate' : 'Reactivate')}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="py-10 px-6 text-center text-[#52635a]">No student accounts match this search.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} className="py-10 px-6 text-center text-[#52635a]">Loading student records…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
