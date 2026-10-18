import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientExam } from '../types';
import { X, Clock, FileQuestion, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ExamInstructionsModalProps {
  examId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmStart: (examId: string) => void;
}

export const ExamInstructionsModal: React.FC<ExamInstructionsModalProps> = ({
  examId,
  isOpen,
  onClose,
  onConfirmStart,
}) => {
  const { language } = useAuth();
  const [exam, setExam] = useState<ClientExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!examId || !isOpen) return;
    setLoading(true);
    setAgreed(false);

    fetch(`/api/exams/${examId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setExam(data.exam);
        }
      })
      .catch((err) => console.error('Error fetching exam instructions', err))
      .finally(() => setLoading(false));
  }, [examId, isOpen]);

  if (!isOpen || !examId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#eceae1] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#173f35] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#235447] text-[#c9ed71] flex items-center justify-center shrink-0 border border-[#2e6d5d]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#c9ed71]">
                CBT Examination Hall Instructions
              </span>
              <h2 className="text-base sm:text-lg font-bold font-display text-white">
                {exam ? (language === 'hi' ? exam.titleHi : exam.titleEn) : 'Loading...'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#dff4e9] hover:bg-[#235447] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#17241f] text-xs sm:text-sm">
          {loading ? (
            <div className="py-12 text-center text-[#52635a]">Loading test guidelines...</div>
          ) : exam ? (
            <>
              {/* Exam Overview Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#f6f5ee] rounded-xl border border-[#eceae1] text-center">
                <div>
                  <span className="block text-[10px] text-[#52635a]">Duration</span>
                  <span className="font-extrabold text-sm sm:text-base text-[#173f35]">
                    {exam.durationMinutes} Minutes
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#52635a]">Questions</span>
                  <span className="font-extrabold text-sm sm:text-base text-[#173f35]">
                    {exam.totalQuestions ?? 20}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#52635a]">Max Marks</span>
                  <span className="font-extrabold text-sm sm:text-base text-[#173f35]">
                    {exam.totalMarks} Marks
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#52635a]">Negative Marking</span>
                  <span className="font-extrabold text-sm sm:text-base text-[#ef765f]">
                    -0.5 per wrong
                  </span>
                </div>
              </div>

              {/* Section Breakdown */}
              {exam.sections && exam.sections.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#52635a] mb-2">
                    {language === 'hi' ? 'अनुभाग विवरण (Sectional Structure)' : 'Test Sections & Allocation'}
                  </h4>
                  <div className="border border-[#eceae1] rounded-xl divide-y divide-[#eceae1]">
                    {exam.sections.map((sec, idx) => (
                      <div key={sec.id} className="p-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#17241f]">
                          {idx + 1}. {language === 'hi' ? sec.nameHi : sec.nameEn}
                        </span>
                        <span className="text-[#52635a] font-mono">
                          {sec.questions ? sec.questions.length : (sec as any).questionCount || 5} Questions
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specific Instructions */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#52635a] mb-2">
                  {language === 'hi' ? 'महत्वपूर्ण नियम एवं दिशा-निर्देश' : 'Key Instructions & Rules'}
                </h4>
                <div className="bg-[#f6f5ee] p-4 rounded-xl space-y-2 text-xs leading-relaxed text-[#17241f] border border-[#eceae1]">
                  <p>
                    • {language === 'hi'
                      ? 'परीक्षक द्वारा निर्धारित समय समाप्त होते ही आपका टेस्ट स्वतः सबमिट (Auto-Submit) हो जाएगा।'
                      : 'The authoritative countdown timer runs on the server. Your exam will automatically submit once time expires.'}
                  </p>
                  <p>
                    • {language === 'hi'
                      ? 'प्रत्येक सही उत्तर के लिए +2.0 अंक मिलेंगे और प्रत्येक गलत उत्तर के लिए -0.5 अंक काटे जाएंगे।'
                      : 'Each correct response awards +2.0 marks; each incorrect choice incurs a -0.5 negative penalty. Unanswered questions incur 0 penalty.'}
                  </p>
                  <p>
                    • {language === 'hi'
                      ? 'आप परीक्षा के दौरान कभी भी शीर्ष बार से भाषा (English ⟷ हिन्दी) बदल सकते हैं। इससे आपके उत्तर सुरक्षित रहेंगे।'
                      : 'You may toggle language between English and Hindi anytime without resetting your timer or answered choices.'}
                  </p>
                  <p>
                    • {language === 'hi'
                      ? 'प्रश्नों की स्थिति (Status) दाएँ पैलेट में रंगों द्वारा दिखाई देगी (हरा = उत्तर दिया, लाल = उत्तर नहीं दिया, बैंगनी = समीक्षा हेतु चिह्नित)।'
                      : 'Question state will be recorded immediately in the right palette (Green = Answered, Red = Not Answered, Purple = Marked for Review).'}
                  </p>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-[#eceae1] hover:bg-[#f6f5ee] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded accent-[#173f35] w-4 h-4"
                />
                <span className="text-xs font-semibold text-[#17241f] leading-snug">
                  {language === 'hi'
                    ? 'मैंने सभी दिशा-निर्देश ध्यानपूर्वक पढ़ और समझ लिए हैं। मैं निष्पक्ष रूप से परीक्षा देने के लिए तैयार हूँ।'
                    : 'I have read and understood all the test instructions and hereby declare that I am ready to begin the examination.'}
                </span>
              </label>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f6f5ee] border-t border-[#eceae1] flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#cfcbbe] text-xs font-bold text-[#52635a] hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!agreed}
            onClick={() => onConfirmStart(examId)}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
              agreed
                ? 'bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'hi' ? 'सीबीटी टेस्ट शुरू करें' : 'I am Ready — Start Exam'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
