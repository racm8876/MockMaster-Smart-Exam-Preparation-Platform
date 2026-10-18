import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { History, Award, BookOpen, Clock, ArrowRight } from 'lucide-react';

interface AttemptHistoryPageProps {
  onGoToResult: (attemptId: string) => void;
  onGoToReview: (attemptId: string) => void;
}

export const AttemptHistoryPage: React.FC<AttemptHistoryPageProps> = ({
  onGoToResult,
  onGoToReview,
}) => {
  const { token, language } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/attempts/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setHistory(data.history);
        }
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3.5 bg-white p-5 rounded-2xl border border-[#eceae1] shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-[#dff4e9] text-[#173f35] flex items-center justify-center shrink-0 border border-[#b8e6ce]">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17241f] font-display">
            {language === 'hi' ? 'परीक्षा इतिहास एवं पिछले प्रयास' : 'Test Attempt History & Prior Records'}
          </h1>
          <p className="mt-0.5 text-xs text-[#52635a]">
            {language === 'hi'
              ? 'आपके द्वारा सबमिट किए गए सभी पिछले मॉक टेस्ट्स का आधिकारिक रिकॉर्ड।'
              : 'Immutable log of your completed examination attempts with direct review access.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#52635a]">Loading test history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#eceae1] space-y-3">
          <History className="w-10 h-10 text-[#52635a] mx-auto" />
          <p className="text-sm font-bold text-[#17241f]">No completed test attempts yet</p>
          <p className="text-xs text-[#52635a]">Take your first CBT mock test to unlock comprehensive history.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#eceae1] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f5ee] border-b border-[#eceae1] text-[#52635a] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Test Title</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Accuracy</th>
                  <th className="py-3.5 px-4">Breakdown</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceae1] text-[#17241f]">
                {history.map((att) => (
                  <tr key={att.id} className="hover:bg-[#f6f5ee]/50 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-bold text-xs sm:text-sm">
                      {language === 'hi' ? att.examTitleHi : att.examTitleEn}
                    </td>
                    <td className="py-4 px-4 text-[#52635a]">
                      {new Date(att.submittedAt).toLocaleDateString()} at{' '}
                      {new Date(att.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-4 font-black font-display text-sm text-[#173f35]">
                      {att.score?.toFixed(1)} <span className="text-[10px] font-normal text-[#52635a]">/ {att.totalMarks}</span>
                    </td>
                    <td className="py-4 px-4 font-bold text-emerald-700">
                      {att.accuracyPercentage}%
                    </td>
                    <td className="py-4 px-4 text-[11px] text-[#52635a]">
                      <span className="text-emerald-700 font-semibold">{att.correctCount}C</span> •{' '}
                      <span className="text-red-600 font-semibold">{att.incorrectCount}W</span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right space-x-2">
                      <button
                        onClick={() => onGoToResult(att.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#cfcbbe] hover:bg-[#f6f5ee] font-bold text-[11px] text-[#173f35] transition-colors"
                      >
                        Scorecard
                      </button>
                      <button
                        onClick={() => onGoToReview(att.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#173f35] text-[#c9ed71] font-bold text-[11px] hover:bg-[#235447] transition-colors"
                      >
                        Solutions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
