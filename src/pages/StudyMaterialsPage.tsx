import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudyMaterial } from '../types';
import { BookOpen, Download, Eye, X } from 'lucide-react';

export const StudyMaterialsPage: React.FC = () => {
  const { language } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMaterial, setActiveMaterial] = useState<StudyMaterial | null>(null);

  useEffect(() => {
    async function loadMaterials() {
      try {
        const res = await fetch('/api/materials');
        const data = await res.json();
        if (data.success) {
          setMaterials(data.materials);
        }
      } catch (err) {
        console.error('Failed to load materials', err);
      } finally {
        setLoading(false);
      }
    }
    loadMaterials();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3.5 bg-white p-5 rounded-2xl border border-[#eceae1] shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-[#dff4e9] text-[#173f35] flex items-center justify-center shrink-0 border border-[#b8e6ce]">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17241f] font-display">
            {language === 'hi' ? 'अखिल भारतीय परीक्षा अध्ययन सामग्री एवं PDF' : 'Curated Study Materials & E-Books'}
          </h1>
          <p className="mt-0.5 text-xs text-[#52635a]">
            {language === 'hi'
              ? 'शीर्ष शिक्षकों द्वारा संकलित सूत्र पुस्तिकाएं, व्याकरण नियम और उच्च-अंक नोट्स।'
              : 'Verified formula handbooks, high-yield subject notes, and previous year revision guides.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#52635a]">Loading study resources...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-[#eceae1] shadow-xs hover:border-[#cfcbbe] transition-all p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#dff4e9] text-[#173f35] flex items-center justify-center font-bold">
                  <BookOpen className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#173f35] bg-[#f6f5ee] px-2 py-0.5 rounded border border-[#eceae1]">
                    PDF Resource • {mat.pagesCount} Pages
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-[#17241f] font-display leading-snug">
                    {language === 'hi' ? mat.titleHi : mat.titleEn}
                  </h3>
                  <p className="text-xs text-[#52635a] line-clamp-3 leading-relaxed">
                    {language === 'hi' ? mat.descriptionHi : mat.descriptionEn}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#eceae1] flex items-center justify-between gap-2 mt-4">
                <span className="text-[11px] text-[#52635a]">{mat.fileSizeMb} MB</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveMaterial(mat);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#173f35] hover:bg-[#235447] text-[#c9ed71] font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View PDF</span>
                  </button>
                  <a
                    href={mat.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="p-1.5 rounded-lg border border-[#cfcbbe] hover:bg-[#f6f5ee] text-[#173f35] transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Interactive Reader Modal */}
      {activeMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#eceae1] overflow-hidden flex flex-col h-[85vh]">
            <div className="bg-[#173f35] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-lg bg-[#235447] text-[#c9ed71] flex items-center justify-center shrink-0 border border-[#2e6d5d]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#c9ed71] uppercase font-bold tracking-wider">
                    MockMaster E-Library Reader
                  </span>
                  <h3 className="text-sm sm:text-base font-bold truncate text-white">
                    {language === 'hi' ? activeMaterial.titleHi : activeMaterial.titleEn}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveMaterial(null)}
                className="p-1.5 rounded-lg text-[#dff4e9] hover:bg-[#235447]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-[#2e3835] p-2 sm:p-4">
              <iframe
                src={activeMaterial.pdfUrl}
                title={activeMaterial.titleEn}
                className="w-full h-full rounded-lg bg-white"
              />
            </div>

            <div className="h-14 bg-white border-t border-[#eceae1] px-6 flex items-center justify-between shrink-0">
              <span className="text-xs text-[#52635a]">{activeMaterial.pagesCount} pages · {activeMaterial.fileSizeMb} MB</span>
              <a href={activeMaterial.pdfUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-[#173f35] text-[#c9ed71] text-xs font-bold">Open in new tab</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
