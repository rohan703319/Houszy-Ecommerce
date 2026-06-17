"use client";

export default function CleanMinimalTemplate({ data }: { data: Record<string, string> }) {
  const heroTitle = data.heroTitle || "";
  const heroImage = data.heroImage || "";

  return (
    <div className="aplus-minimal bg-slate-50 text-slate-800 border border-slate-200/60 rounded-3xl p-6 sm:p-10 font-sans space-y-8">
      {heroTitle && (
        <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-center text-slate-900 max-w-xl mx-auto leading-relaxed">
          {heroTitle}
        </h3>
      )}

      {heroImage && (
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white p-2 shadow-sm max-w-4xl mx-auto">
          <div className="rounded-xl overflow-hidden aspect-[16/9]">
            <img src={heroImage} alt={heroTitle || "Minimal view"} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {['1', '2', '3'].map(num => {
        const title = data[`feature${num}Title`] || data[`feat${num}Title`] || "";
        const desc = data[`feature${num}Desc`] || data[`feat${num}Desc`] || "";
        if (!title) return null;
        return (
          <div key={num} className="max-w-2xl mx-auto space-y-3 pt-6 border-t border-slate-200/60 text-center">
            <h4 className="text-sm font-bold text-slate-955 uppercase tracking-widest">{title}</h4>
            <p className="text-xs sm:text-sm text-slate-650 leading-relaxed max-w-xl mx-auto whitespace-pre-line">{desc}</p>
          </div>
        );
      })}
    </div>
  );
}
