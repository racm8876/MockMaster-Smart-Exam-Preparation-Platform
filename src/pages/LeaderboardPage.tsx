import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, Flame, Target, Award, Sparkles } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { user, language } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'daily' | 'weekly' | 'all-time'>('weekly');

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dff4e9] text-[#173f35] text-xs font-bold">
          <Trophy className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'अखिल भारतीय लाइव रैंक तालिका' : 'All-India National Merit Standings'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17241f] font-display">
          {language === 'hi' ? 'प्रतिभाशाली अभ्यर्थियों की लीडरबोर्ड' : 'MockMaster Aspirants Leaderboard'}
        </h1>
        <p className="text-xs sm:text-sm text-[#52635a]">
          {language === 'hi'
            ? 'मॉक टेस्ट स्कोर, सटीकता और अध्ययन निरंतरता के आधार पर संकलित राष्ट्रीय रैंकिंग।'
            : 'Ranks dynamically derived from authenticated mock scores, high accuracy rates, and daily practice streaks.'}
        </p>
      </div>

      {/* Period Tabs */}
      <div className="flex justify-center">
        <div className="bg-white p-1 rounded-xl border border-[#eceae1] shadow-xs flex items-center gap-1 text-xs font-bold">
          <button
            onClick={() => setFilterPeriod('daily')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              filterPeriod === 'daily'
                ? 'bg-[#173f35] text-[#c9ed71] shadow-xs'
                : 'text-[#52635a] hover:text-[#173f35]'
            }`}
          >
            Daily Drill
          </button>
          <button
            onClick={() => setFilterPeriod('weekly')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              filterPeriod === 'weekly'
                ? 'bg-[#173f35] text-[#c9ed71] shadow-xs'
                : 'text-[#52635a] hover:text-[#173f35]'
            }`}
          >
            Weekly Sprint
          </button>
          <button
            onClick={() => setFilterPeriod('all-time')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              filterPeriod === 'all-time'
                ? 'bg-[#173f35] text-[#c9ed71] shadow-xs'
                : 'text-[#52635a] hover:text-[#173f35]'
            }`}
          >
            All-Time Hall of Fame
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 items-end">
          {/* Rank 2 (Silver) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs text-center space-y-3 order-2 sm:order-1">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 font-black text-lg mx-auto flex items-center justify-center border-2 border-slate-300">
              🥈 2
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#17241f]">{topThree[1].name}</h3>
              <p className="text-[11px] text-[#52635a]">{topThree[1].testsCompleted} Tests Completed</p>
            </div>
            <div className="p-2 bg-[#f6f5ee] rounded-xl text-xs font-bold text-[#173f35]">
              {topThree[1].points} Points • {topThree[1].avgAccuracy}% Acc
            </div>
          </div>

          {/* Rank 1 (Gold) */}
          <div className="bg-gradient-to-b from-[#173f35] to-[#235447] text-white rounded-2xl p-6 border border-[#235447] shadow-md text-center space-y-3 order-1 sm:order-2 transform sm:-translate-y-2">
            <div className="w-14 h-14 rounded-full bg-[#c9ed71] text-[#173f35] font-black text-xl mx-auto flex items-center justify-center border-2 border-white shadow-md">
              👑 1
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#c9ed71]">
                National Rank Leader
              </span>
              <h3 className="font-extrabold text-base text-white">{topThree[0].name}</h3>
              <p className="text-[11px] text-[#dff4e9]">{topThree[0].testsCompleted} Tests Completed</p>
            </div>
            <div className="p-2.5 bg-black/20 rounded-xl text-xs font-bold text-[#c9ed71]">
              🔥 {topThree[0].points} Points • {topThree[0].avgAccuracy}% Acc
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs text-center space-y-3 order-3 sm:order-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-black text-lg mx-auto flex items-center justify-center border-2 border-amber-300">
              🥉 3
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#17241f]">{topThree[2].name}</h3>
              <p className="text-[11px] text-[#52635a]">{topThree[2].testsCompleted} Tests Completed</p>
            </div>
            <div className="p-2 bg-[#f6f5ee] rounded-xl text-xs font-bold text-[#173f35]">
              {topThree[2].points} Points • {topThree[2].avgAccuracy}% Acc
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-[#eceae1] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f6f5ee] border-b border-[#eceae1] text-[#52635a] uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4 sm:px-6">Rank</th>
              <th className="py-3 px-4">Candidate</th>
              <th className="py-3 px-4">Tests Taken</th>
              <th className="py-3 px-4">Accuracy</th>
              <th className="py-3 px-4 sm:px-6 text-right">Preparation Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceae1] text-[#17241f]">
            {leaderboard.map((item) => {
              const isCurrentUser = user && user.name === item.name;
              return (
                <tr
                  key={item.rank}
                  className={`transition-colors ${
                    isCurrentUser ? 'bg-[#dff4e9]/60 font-bold' : 'hover:bg-[#f6f5ee]/50'
                  }`}
                >
                  <td className="py-3.5 px-4 sm:px-6 font-extrabold text-[#173f35]">
                    #{item.rank}
                  </td>
                  <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                    <span>{item.name}</span>
                    {isCurrentUser && (
                      <span className="text-[10px] bg-[#173f35] text-[#c9ed71] px-1.5 py-0.2 rounded">
                        You
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[#52635a]">{item.testsCompleted}</td>
                  <td className="py-3.5 px-4 text-emerald-700 font-semibold">{item.avgAccuracy}%</td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-black font-display text-sm text-[#173f35]">
                    {item.points} pts
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
