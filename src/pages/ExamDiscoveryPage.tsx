import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientExam } from '../types';
import {
  Search,
  Filter,
  Clock,
  FileQuestion,
  Award,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { LogoIcon } from '../components/common/Logo';

interface ExamDiscoveryPageProps {
  onStartExam: (examId: string) => void;
}

export const ExamDiscoveryPage: React.FC<ExamDiscoveryPageProps> = ({ onStartExam }) => {
  const { language } = useAuth();
  const [exams, setExams] = useState<ClientExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch('/api/exams');
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
  }, []);

  const categories = [
    { id: 'all', nameEn: 'All Exams', nameHi: 'सभी परीक्षाएं' },
    { id: 'cat-ssc', nameEn: 'SSC (CGL, CHSL, CPO)', nameHi: 'एसएससी (सीजीएल, सीएचएसएल)' },
    { id: 'cat-banking', nameEn: 'Banking (IBPS, SBI)', nameHi: 'बैंकिंग (आईबीपीएस, एसबीआई)' },
    { id: 'cat-railway', nameEn: 'Railways (RRB NTPC)', nameHi: 'रेलवे (आरआरबी एनटीपीसी)' },
  ];

  const filteredExams = exams.filter((exam) => {
    const matchesCategory = selectedCategory === 'all' || exam.categoryId === selectedCategory;
    const matchesSearch =
      !search ||
      exam.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      exam.titleHi.toLowerCase().includes(search.toLowerCase()) ||
      (exam.descriptionEn && exam.descriptionEn.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-[#eceae1] shadow-xs">
        <div className="flex items-center gap-3.5">
          <LogoIcon size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#173f35] bg-[#dff4e9] px-2 py-0.5 rounded border border-[#b8e6ce]">
                Official Test Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#17241f] font-display mt-0.5">
              {language === 'hi' ? 'अखिल भारतीय लाइव मॉक टेस्ट श्रृंखला' : 'All India Live CBT Mock Test Series'}
            </h1>
            <p className="text-xs text-[#52635a] mt-0.5">
              {language === 'hi'
                ? 'नवीनतम पाठ्यक्रम एवं वास्तविक परीक्षा पैटर्न पर आधारित द्विभाषी (English & Hindi) टेस्ट पेपर्स।'
                : 'Authentic bilingual practice tests featuring real-time CBT navigation, timer expiry, and negative marking.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#eceae1] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#173f35] text-[#c9ed71] shadow-xs'
                  : 'bg-[#f6f5ee] text-[#52635a] hover:text-[#17241f] hover:bg-[#eceae1]'
              }`}
            >
              {language === 'hi' ? cat.nameHi : cat.nameEn}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#52635a] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'hi' ? 'टेस्ट का नाम खोजें...' : 'Search exams...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#cfcbbe] bg-[#f6f5ee] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173f35]"
          />
        </div>
      </div>

      {/* Exam Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#52635a] text-xs">Loading available test papers...</div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#eceae1] space-y-2">
          <AlertCircle className="w-8 h-8 text-[#52635a] mx-auto" />
          <p className="text-sm font-bold text-[#17241f]">No tests found matching your criteria</p>
          <p className="text-xs text-[#52635a]">Try clearing your search query or selecting a different category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-[#eceae1] hover:border-[#cfcbbe] shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#dff4e9] text-[#173f35]">
                    {language === 'hi' ? exam.categoryNameHi || 'सामान्य' : exam.categoryNameEn || 'SSC'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f6f5ee] text-[#173f35] border border-[#eceae1]">
                    CBT 2026
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#17241f] font-display leading-snug line-clamp-2">
                    {language === 'hi' ? exam.titleHi : exam.titleEn}
                  </h3>
                  <p className="text-xs text-[#52635a] mt-1.5 line-clamp-2 leading-relaxed">
                    {language === 'hi' ? exam.descriptionHi : exam.descriptionEn}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#eceae1] text-center">
                  <div>
                    <span className="block text-[10px] text-[#52635a]">Questions</span>
                    <span className="text-xs font-bold text-[#17241f]">{exam.totalQuestions ?? 20}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#52635a]">Duration</span>
                    <span className="text-xs font-bold text-[#17241f]">{exam.durationMinutes} mins</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#52635a]">Marks</span>
                    <span className="text-xs font-bold text-[#17241f]">{exam.totalMarks}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#52635a]">
                  <span>Marking: <strong className="text-[#173f35]">+2.0</strong> / <strong className="text-red-600">-0.5</strong></span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Instant Analysis
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#f6f5ee] border-t border-[#eceae1]">
                <button
                  onClick={() => onStartExam(exam.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <span>{language === 'hi' ? 'परीक्षा शुरू करें' : 'Start CBT Attempt'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
