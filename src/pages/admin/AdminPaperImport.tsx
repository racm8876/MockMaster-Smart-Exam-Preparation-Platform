import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ParsedQuestionDraft } from '../../types';
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  ArrowRight,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { LogoIcon } from '../../components/common/Logo';

const SAMPLE_TEXT_PAPER = `Q1. Which constitutional amendment lowered the voting age in India from 21 to 18 years?
(A) 42nd Amendment Act
(B) 44th Amendment Act
(C) 61st Amendment Act
(D) 73rd Amendment Act
Ans: C
Explanation: The 61st Constitutional Amendment Act, 1988 amended Article 326 to lower the voting age from 21 to 18 years.

Q2. If a sum doubles itself in 5 years at simple interest, in how many years will it become 4 times of itself?
(A) 10 years
(B) 15 years
(C) 20 years
(D) 25 years
Ans: B
Explanation: If sum doubles in 5 years, interest = P in 5 years. For becoming 4 times, interest needed = 3P. Time required = 3 * 5 = 15 years.

Q3. Choose the correctly spelt word:
(A) Accomodate
(B) Accommodate
(C) Acomodate
(D) Accomadate
Ans: B
Explanation: The correct spelling is 'Accommodate' with double 'c' and double 'm'.`;

export const AdminPaperImport: React.FC = () => {
  const { token, language } = useAuth();
  const [format, setFormat] = useState<'text' | 'json'>('text');
  const [rawText, setRawText] = useState(SAMPLE_TEXT_PAPER);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestionDraft[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState<string | null>(null);

  const handleParse = async () => {
    if (!rawText.trim() || !token) return;
    setIsParsing(true);
    setCommitMessage(null);

    try {
      const res = await fetch('/api/admin/imports/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rawText, format }),
      });
      const data = await res.json();
      if (data.success) {
        setParsedQuestions(data.questions || []);
      } else {
        alert(data.error || 'Parsing failure');
      }
    } catch (err: any) {
      alert('Error parsing document: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdateDecision = (index: number, decision: 'KEEP' | 'REPLACE' | 'SKIP') => {
    setParsedQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, decision } : q))
    );
  };

  const handleCommit = async () => {
    if (parsedQuestions.length === 0 || !token || isCommitting) return;
    setIsCommitting(true);

    try {
      const res = await fetch('/api/admin/imports/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questions: parsedQuestions,
          targetExamId: 'exam-ssc-cgl-01',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCommitMessage(data.message || `Successfully imported ${data.committedCount} questions into draft workspace.`);
        setParsedQuestions([]);
      } else {
        alert(data.error || 'Failed to commit imported questions.');
      }
    } catch (err: any) {
      alert('Commit failed: ' + err.message);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3.5 bg-white p-5 rounded-2xl border border-[#eceae1] shadow-xs">
        <LogoIcon size="md" />
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17241f] font-display">
            {language === 'hi' ? 'स्मार्ट पेपर आयात एवं अनिवार्य समीक्षा कार्यक्षेत्र' : 'Question Paper Import & Review Workspace'}
          </h1>
          <p className="mt-0.5 text-xs text-[#52635a]">
            Import raw text papers, DOCX text, CSV, or JSON with auto-key extraction and manual validation.
          </p>
        </div>
      </div>

      {commitMessage && (
        <div className="p-4 rounded-2xl bg-[#dff4e9] border border-[#b8e6ce] text-[#173f35] text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#173f35] shrink-0" />
          <span>{commitMessage}</span>
        </div>
      )}

      {/* 1. Ingestion Box */}
      <div className="bg-white rounded-2xl p-6 border border-[#eceae1] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#17241f]">Source Format:</span>
            <button
              onClick={() => setFormat('text')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                format === 'text'
                  ? 'bg-[#173f35] text-[#c9ed71]'
                  : 'bg-[#f6f5ee] text-[#52635a]'
              }`}
            >
              Text Paper (Q1, A, B, Ans)
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                format === 'json'
                  ? 'bg-[#173f35] text-[#c9ed71]'
                  : 'bg-[#f6f5ee] text-[#52635a]'
              }`}
            >
              Structured JSON
            </button>
          </div>

          <button
            onClick={() => setRawText(SAMPLE_TEXT_PAPER)}
            className="text-xs font-bold text-[#173f35] hover:underline"
          >
            Insert SSC CGL Sample Text
          </button>
        </div>

        <textarea
          rows={8}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste question paper text here..."
          className="w-full p-4 rounded-xl border border-[#cfcbbe] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#173f35]"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#52635a]">
            Regex parser auto-detects Q1., (A), (B), (C), (D), Ans:, and Explanation:
          </span>
          <button
            onClick={handleParse}
            disabled={isParsing}
            className="px-5 py-2.5 rounded-xl bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{isParsing ? 'Parsing Document...' : 'Run Parser & Review'}</span>
          </button>
        </div>
      </div>

      {/* 2. Mandatory Review Workspace */}
      {parsedQuestions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-[#eceae1] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eceae1] pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ef765f]">
                Mandatory Pre-Commit Verification
              </span>
              <h2 className="text-lg font-bold text-[#17241f] font-display">
                Parsed Questions Review ({parsedQuestions.length} Items)
              </h2>
            </div>

            <button
              onClick={handleCommit}
              disabled={isCommitting}
              className="px-6 py-2.5 rounded-xl bg-[#ef765f] hover:bg-[#dc583f] text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCommitting ? 'Committing...' : 'Confirm & Commit to Draft Exam'}</span>
            </button>
          </div>

          <div className="space-y-4">
            {parsedQuestions.map((q, idx) => (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  q.decision === 'SKIP'
                    ? 'bg-gray-100 border-gray-300 opacity-60'
                    : q.status === 'WARNING'
                    ? 'bg-amber-50/50 border-amber-300'
                    : 'bg-[#f6f5ee]/60 border-[#eceae1]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-[#173f35]">Item #{idx + 1}</span>
                    {q.status === 'WARNING' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {q.warningMessage}
                      </span>
                    )}
                    {q.status === 'VALID' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Valid Schema
                      </span>
                    )}
                  </div>

                  {/* Decision Buttons */}
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <button
                      onClick={() => handleUpdateDecision(idx, 'KEEP')}
                      className={`px-2.5 py-1 rounded-lg ${
                        q.decision === 'KEEP'
                          ? 'bg-[#173f35] text-[#c9ed71]'
                          : 'bg-white border text-[#52635a]'
                      }`}
                    >
                      Keep
                    </button>
                    <button
                      onClick={() => handleUpdateDecision(idx, 'SKIP')}
                      className={`px-2.5 py-1 rounded-lg ${
                        q.decision === 'SKIP'
                          ? 'bg-red-600 text-white'
                          : 'bg-white border text-[#52635a]'
                      }`}
                    >
                      Skip
                    </button>
                  </div>
                </div>

                <div className="font-semibold text-xs text-[#17241f]">{q.textEn}</div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt) => (
                    <div
                      key={opt.key}
                      className={`p-2 rounded-lg border flex items-center justify-between ${
                        opt.isCorrect
                          ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950'
                          : 'bg-white border-[#eceae1]'
                      }`}
                    >
                      <span>
                        <strong>({opt.key})</strong> {opt.textEn}
                      </span>
                      {opt.isCorrect && (
                        <span className="text-[9px] uppercase font-bold text-emerald-700">Correct</span>
                      )}
                    </div>
                  ))}
                </div>

                {q.explanationEn && (
                  <div className="text-[11px] text-[#52635a] bg-white p-2 rounded-lg border border-[#eceae1]">
                    <strong>Explanation:</strong> {q.explanationEn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
