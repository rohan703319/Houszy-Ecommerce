"use client";

import { Sparkles } from "lucide-react";

export default function BoldModernTemplate({ data }: { data: Record<string, string> }) {
  const heroTitle = data.heroTitle || "";
  const heroSubtitle = data.heroSubtitle || "";
  const heroImage = data.heroImage || "";

  return (
    <div className="aplus-modern bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm p-6 sm:p-8 space-y-8">
      {/* Header Accent Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1.5 bg-violet-650 rounded-full" />
          <h3 className="text-base font-bold text-slate-900">Modern Layout Overview</h3>
        </div>
        <span className="text-[10px] font-bold text-violet-600 uppercase bg-violet-50 px-2 py-0.5 rounded border border-violet-100 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Innovative Design
        </span>
      </div>

      {/* Hero Card */}
      {heroImage && (
        <div 
          className="aplus-hero relative w-full aspect-[2/1] rounded-2xl overflow-hidden bg-cover bg-center flex items-center p-6 sm:p-10 text-white shadow-sm" 
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />
          <div className="relative z-10 max-w-md space-y-2">
            {heroTitle && <h4 className="text-lg sm:text-2xl font-black uppercase tracking-tight">{heroTitle}</h4>}
            {heroSubtitle && <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed">{heroSubtitle}</p>}
          </div>
        </div>
      )}

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {['1', '2', '3', '4'].map(num => {
          const title = data[`feature${num}Title`] || data[`feat${num}Title`] || "";
          const desc = data[`feature${num}Desc`] || data[`feat${num}Desc`] || "";
          if (!title) return null;
          return (
            <div key={num} className="bg-slate-50 border-l-4 border-violet-600 p-5 rounded-r-2xl space-y-2 hover:bg-slate-100/50 transition">
              <h5 className="text-sm sm:text-base font-extrabold text-slate-800 uppercase tracking-tight">{title}</h5>
              <p className="text-xs sm:text-sm text-slate-650 leading-relaxed whitespace-pre-line">{desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
