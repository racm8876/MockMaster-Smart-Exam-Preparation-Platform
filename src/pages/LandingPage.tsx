import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientExam } from '../types';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Globe,
  TrendingUp,
  FileQuestion,
  Users,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface LandingPageProps {
  onStartExam: (examId: string) => void;
  onOpenAuthModal: (tab: 'login' | 'register') => void;
  onExploreTests: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartExam,
  onOpenAuthModal,
  onExploreTests,
}) => {
  const { language } = useAuth();
  const [featuredExam, setFeaturedExam] = useState<ClientExam | null>(null);

  useEffect(() => {
    fetch('/api/exams')
      .then((response) => response.json())
      .then((data) => setFeaturedExam(data.success ? data.exams?.[0] || null : null))
      .catch(() => setFeaturedExam(null));
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#173f35] via-[#1f5246] to-[#0f2c25] text-white p-8 sm:p-14 shadow-xl">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#c9ed71] border border-white/20 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-[#c9ed71]" />
            <span>{language === 'hi' ? 'अखिल भारतीय सीबीटी परीक्षा तैयारी पोर्टल 2026' : 'National CBT Examination Simulator 2026'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display leading-[1.15] text-white">
            {language === 'hi'
              ? 'प्रतियोगी परीक्षाओं में शीर्ष रैंक हासिल करने का विश्वसनीय माध्यम।'
              : 'Master Competitive Exams with Authentic CBT Mock Tests.'}
          </h1>

          <p className="text-sm sm:text-base text-[#dff4e9] leading-relaxed max-w-2xl">
            {language === 'hi'
              ? 'एसएससी (CGL/CHSL), बैंकिंग (IBPS/SBI) और रेलवे (RRB NTPC) के लिए सर्वर-सत्यापित समय-सीमा, नेगेटिव मार्किंग और गहन समाधानों के साथ अभ्यास करें।'
              : 'Prepare for SSC, Banking, Railways & Civil Services with real-time countdown timer simulation, server-authoritative negative marking, instant percentiles, and bilingual solutions.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => featuredExam ? onStartExam(featuredExam.id) : onExploreTests()}
              className="px-6 py-3 rounded-xl bg-[#c9ed71] hover:bg-[#b8e25d] text-[#173f35] font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <span>{featuredExam ? (language === 'hi' ? 'लाइव टेस्ट शुरू करें' : 'Start Available Test') : (language === 'hi' ? 'टेस्ट कैटलॉग देखें' : 'Browse Test Catalog')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onExploreTests}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
            >
              {language === 'hi' ? 'सभी टेस्ट श्रृंखला देखें' : 'Browse All Test Series'}
            </button>
            <button
              onClick={() => onOpenAuthModal('register')}
              className="px-5 py-3 rounded-xl bg-white text-[#173f35] font-extrabold text-xs sm:text-sm hover:bg-[#f6f5ee] transition-all"
            >
              {language === 'hi' ? 'छात्र पंजीकरण' : 'Register Free'}
            </button>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#b8e6ce]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#c9ed71]" /> 100% Bilingual (English & Hindi)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#c9ed71]" /> Strict Anti-Leak Answer Security
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#c9ed71]" /> Instant Sectional Analysis
            </span>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute right-[-60px] top-[-60px] w-96 h-96 rounded-full bg-[#c9ed71]/10 blur-3xl pointer-events-none" />
      </section>

      {/* 2. Platform Value Propositions */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17241f] font-display">
            Built for Serious Government Exam Aspirants
          </h2>
          <p className="text-xs sm:text-sm text-[#52635a]">
            Everything engineered to duplicate the exact conditions of actual examination centers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#eceae1] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#dff4e9] text-[#173f35] flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-[#17241f] font-display">
              Authentic CBT Interface & Timer
            </h3>
            <p className="text-xs text-[#52635a] leading-relaxed">
              Real-time countdown timer synchronized with the server. State-coded question palette (Answered, Not Answered, Marked for Review) and auto-submission on expiry.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#eceae1] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#ffece8] text-[#ef765f] flex items-center justify-center font-bold">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-[#17241f] font-display">
              Seamless Bilingual Toggle
            </h3>
            <p className="text-xs text-[#52635a] leading-relaxed">
              Switch smoothly between English and Hindi during live tests without resetting your selected options or losing precious examination time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#eceae1] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#eef8cf] text-[#173f35] flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-[#17241f] font-display">
              Deep Diagnostic Analytics
            </h3>
            <p className="text-xs text-[#52635a] leading-relaxed">
              Instant scorecards with negative deductions (-0.5), accuracy ratios, percentile rankings against other test takers, and topic-wise weak area identification.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Featured published exam, loaded from the API */}
      {featuredExam ? <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eceae1] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#dff4e9] text-[#173f35]">
              Featured Live Exam
            </span>
            <span className="text-xs text-[#52635a] font-semibold">Tier 1 National Pattern</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#17241f] font-display">
            {language === 'hi' ? featuredExam.titleHi : featuredExam.titleEn}
          </h3>
          <p className="text-xs text-[#52635a] leading-relaxed">
            {language === 'hi' ? featuredExam.descriptionHi : featuredExam.descriptionEn}
          </p>
          <div className="flex items-center gap-4 text-xs font-bold text-[#173f35]">
            <span>{featuredExam.totalQuestions ?? 0} Questions</span>
            <span>•</span>
            <span>{featuredExam.durationMinutes} Minutes</span>
            <span>•</span>
            <span>{featuredExam.totalMarks} Marks</span>
          </div>
        </div>

        <button
          onClick={() => onStartExam(featuredExam.id)}
          className="px-6 py-3.5 rounded-xl bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <span>Start CBT Attempt</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section> : <section className="bg-white rounded-3xl p-8 border border-dashed border-[#cfcbbe] text-center space-y-3">
        <h3 className="text-lg font-bold text-[#17241f]">No published tests yet</h3>
        <p className="text-xs text-[#52635a]">Published exams will appear here as soon as an administrator makes them available.</p>
        <button onClick={onExploreTests} className="px-5 py-2.5 rounded-xl bg-[#173f35] text-[#c9ed71] text-xs font-bold">Browse Test Catalog</button>
      </section>}
    </div>
  );
};
