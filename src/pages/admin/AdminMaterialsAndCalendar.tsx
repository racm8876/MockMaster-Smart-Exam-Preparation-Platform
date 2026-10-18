import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudyMaterial, CalendarEvent } from '../../types';
import { BookOpen, Calendar, Plus, Trash2, CheckCircle2, X, CalendarDays } from 'lucide-react';

export const AdminMaterialsAndCalendar: React.FC = () => {
  const { token, language } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // New material modal
  const [showMatModal, setShowMatModal] = useState(false);
  const [matTitleEn, setMatTitleEn] = useState('');
  const [matTitleHi, setMatTitleHi] = useState('');
  const [matDescEn, setMatDescEn] = useState('');
  const [matPdfUrl, setMatPdfUrl] = useState('');
  const [matPages, setMatPages] = useState(24);
  const [matSize, setMatSize] = useState(2.8);

  // New event modal
  const [showEvtModal, setShowEvtModal] = useState(false);
  const [evtTitleEn, setEvtTitleEn] = useState('');
  const [evtTitleHi, setEvtTitleHi] = useState('');
  const [evtDate, setEvtDate] = useState('2026-11-20');
  const [evtType, setEvtType] = useState<'EXAM' | 'ADMIT_CARD' | 'RESULT' | 'NOTIFICATION'>('EXAM');

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, eRes] = await Promise.all([
          fetch('/api/materials'),
          fetch('/api/calendar/events', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const mData = await mRes.json();
        const eData = await eRes.json();
        if (mData.success) setMaterials(mData.materials);
        if (eData.success) setEvents(eData.officialEvents || []);
      } catch (err) {
        console.error('Failed to load admin materials and calendar', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitleEn.trim() || !token) return;

    try {
      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titleEn: matTitleEn,
          titleHi: matTitleHi || matTitleEn,
          descriptionEn: matDescEn,
          pdfUrl: matPdfUrl,
          pagesCount: matPages,
          fileSizeMb: matSize,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMaterials((prev) => [...prev, data.material]);
        setShowMatModal(false);
        setMatTitleEn('');
        setMatPdfUrl('');
      }
    } catch {}
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/admin/materials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch {}
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitleEn.trim() || !token) return;

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titleEn: evtTitleEn,
          titleHi: evtTitleHi || evtTitleEn,
          date: evtDate,
          type: evtType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => [...prev, data.event]);
        setShowEvtModal(false);
        setEvtTitleEn('');
      }
    } catch {}
  };

  const handleDeleteEvent = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3.5 bg-white p-5 rounded-2xl border border-[#eceae1] shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-[#dff4e9] text-[#173f35] flex items-center justify-center shrink-0 border border-[#b8e6ce]">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17241f] font-display">
            {language === 'hi' ? 'संसाधन एवं परीक्षा कैलेंडर नियंत्रण' : 'Learning Resources & Examination Calendar'}
          </h1>
          <p className="mt-0.5 text-xs text-[#52635a]">
            Manage published PDF guides, official exam dates, admit card alerts, and calendar notifications.
          </p>
        </div>
      </div>

      {/* 1. Study Materials Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#17241f] font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#173f35]" />
              <span>Published Study Material Modules</span>
            </h2>
            <p className="text-xs text-[#52635a]">PDF e-books and formula sheets accessible to students.</p>
          </div>

          <button
            onClick={() => setShowMatModal(true)}
            className="px-4 py-2 rounded-xl bg-[#173f35] text-[#c9ed71] font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New PDF Guide</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((mat) => (
            <div key={mat.id} className="bg-white p-4 rounded-xl border border-[#eceae1] shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#173f35] bg-[#dff4e9] px-2 py-0.5 rounded">
                  {mat.pagesCount} Pages • {mat.fileSizeMb} MB
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-[#17241f] pt-1">{mat.titleEn}</h4>
                <p className="text-xs text-[#52635a] line-clamp-2">{mat.descriptionEn}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#eceae1] mt-3">
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live
                </span>
                <button
                  onClick={() => handleDeleteMaterial(mat.id)}
                  className="p-1 text-[#52635a] hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Official Academic Calendar Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#17241f] font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#173f35]" />
              <span>Official Academic & Examination Calendar</span>
            </h2>
            <p className="text-xs text-[#52635a]">Publish verified exam dates, notification alerts, and admit card notices.</p>
          </div>

          <button
            onClick={() => setShowEvtModal(true)}
            className="px-4 py-2 rounded-xl bg-[#173f35] text-[#c9ed71] font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Calendar Event</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#eceae1] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f5ee] border-b border-[#eceae1] text-[#52635a] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Event Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-6">Notification / Examination Title</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceae1] text-[#17241f]">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#f6f5ee]/50">
                  <td className="py-3.5 px-6 font-bold text-[#173f35]">{evt.date}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#f6f5ee] border border-[#eceae1]">
                      {evt.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-semibold">{evt.titleEn}</td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="p-1 text-[#52635a] hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Material Modal */}
      {showMatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#eceae1]">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceae1]">
              <h3 className="font-extrabold text-base text-[#173f35] font-display">Upload PDF Study Guide</h3>
              <button onClick={() => setShowMatModal(false)}><X className="w-5 h-5 text-[#52635a]" /></button>
            </div>
            <form onSubmit={handleCreateMaterial} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Title (English)</label>
                <input
                  type="text"
                  required
                  value={matTitleEn}
                  onChange={(e) => setMatTitleEn(e.target.value)}
                  placeholder="e.g. 100 Golden Rules of Reasoning..."
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">PDF URL</label>
                <input
                  type="url"
                  required
                  value={matPdfUrl}
                  onChange={(e) => setMatPdfUrl(e.target.value)}
                  placeholder="https://cdn.example.com/guide.pdf"
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
                <p className="mt-1 text-[10px] text-[#52635a]">Use an HTTPS .pdf URL or an application-relative PDF path.</p>
              </div>
              <div>
                <label className="font-bold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={matDescEn}
                  onChange={(e) => setMatDescEn(e.target.value)}
                  placeholder="Detailed breakdown of shortcuts..."
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Pages Count</label>
                  <input
                    type="number"
                    value={matPages}
                    onChange={(e) => setMatPages(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">File Size (MB)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={matSize}
                    onChange={(e) => setMatSize(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#eceae1]">
                <button
                  type="button"
                  onClick={() => setShowMatModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-[#52635a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#173f35] text-[#c9ed71] font-bold rounded-xl"
                >
                  Publish Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Event Modal */}
      {showEvtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#eceae1]">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceae1]">
              <h3 className="font-extrabold text-base text-[#173f35] font-display">Create Examination Calendar Event</h3>
              <button onClick={() => setShowEvtModal(false)}><X className="w-5 h-5 text-[#52635a]" /></button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={evtTitleEn}
                  onChange={(e) => setEvtTitleEn(e.target.value)}
                  placeholder="e.g. SSC CGL 2026 Tier 1 Examination Phase..."
                  className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Event Category</label>
                  <select
                    value={evtType}
                    onChange={(e) => setEvtType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#cfcbbe]"
                  >
                    <option value="EXAM">Examination</option>
                    <option value="NOTIFICATION">Official Notification</option>
                    <option value="ADMIT_CARD">Admit Card / City Slip</option>
                    <option value="RESULT">Final Result</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#eceae1]">
                <button
                  type="button"
                  onClick={() => setShowEvtModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-[#52635a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#173f35] text-[#c9ed71] font-bold rounded-xl"
                >
                  Save to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
