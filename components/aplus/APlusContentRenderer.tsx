"use client";

import { useState, useEffect } from "react";
import { aplusTemplatesService, APlusTemplate, APlusTemplateField } from "@/lib/services/aplusTemplates";
import { Sparkles, Layout, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

interface APlusContentRendererProps {
  aPlusTemplateId: string | null;
  aPlusContent: string | null;
}

export default function APlusContentRenderer({
  aPlusTemplateId,
  aPlusContent,
}: APlusContentRendererProps) {
  const [template, setTemplate] = useState<APlusTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [faqOpen, setFaqOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!aPlusTemplateId) {
      setTemplate(null);
      return;
    }

    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await aplusTemplatesService.getById(aPlusTemplateId);
        if (res.data?.success && res.data.data) {
          setTemplate(res.data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch A+ template details", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [aPlusTemplateId]);

  if (!aPlusTemplateId || !aPlusContent) return null;

  if (loading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        <p className="text-sm text-slate-500 animate-pulse">Loading premium product details...</p>
      </div>
    );
  }

  if (error || !template) return null;

  // Parse values
  let values: Record<string, string> = {};
  try {
    values = JSON.parse(aPlusContent);
  } catch (err) {
    console.error("Failed to parse A+ content values", err);
    return null;
  }

  // Parse fields list to make sure we render keys that exist in the template
  let fields: APlusTemplateField[] = [];
  try {
    fields = JSON.parse(template.sectionsJson);
  } catch (err) {
    console.error("Failed to parse A+ sections json schema", err);
  }

  const nameLower = template.name.toLowerCase();

  // Decide which preset layout style to use
  let layoutType: "premium" | "darkLuxury" | "cleanMinimal" | "boldModern" | "custom" = "premium";
  if (nameLower.includes("dark") || nameLower.includes("luxury") || nameLower.includes("black")) {
    layoutType = "darkLuxury";
  } else if (nameLower.includes("minimal") || nameLower.includes("clean") || nameLower.includes("white")) {
    layoutType = "cleanMinimal";
  } else if (nameLower.includes("modern") || nameLower.includes("bold") || nameLower.includes("accent")) {
    layoutType = "boldModern";
  } else if (nameLower.includes("premium")) {
    layoutType = "premium";
  } else {
    // If name doesn't match, infer from visual schema keys to be robust against custom template names
    const keys = fields.map(f => f.key);
    if (keys.some(k => k.startsWith("faq") || k.startsWith("split3") || k.includes("featHeading") || k.includes("featuresHeading") || k.startsWith("split1"))) {
      layoutType = "premium";
    } else if (keys.some(k => k.startsWith("split2"))) {
      layoutType = "darkLuxury";
    } else if (keys.some(k => k.includes("feature2") || k.includes("feat2"))) {
      layoutType = "boldModern";
    } else if (keys.some(k => k.includes("feature1") || k.includes("feat1"))) {
      layoutType = "cleanMinimal";
    } else {
      const prebuiltKeys = [
        "heroTitle", "heroSubtitle", "heroImage", "heroTag",
        "featHeading", "featuresHeading",
        "feature1Title", "feature1Desc", "feat1Title", "feat1Desc",
        "feature2Title", "feature2Desc", "feat2Title", "feat2Desc",
        "feature3Title", "feature3Desc", "feat3Title", "feat3Desc",
        "feature4Title", "feature4Desc", "feat4Title", "feat4Desc",
        "feature5Title", "feature5Desc", "feat5Title", "feat5Desc",
        "split1Image", "split1Title", "split1Text", "split1Desc",
        "split2Image", "split2Title", "split2Text", "split2Desc",
        "split3Image", "split3Title", "split3Text", "split3Desc",
        "faq1Question", "faq1Answer", "faq2Question", "faq2Answer", "faq3Question", "faq3Answer"
      ];
      const hasCustomKeys = fields.some(f => !prebuiltKeys.includes(f.key));
      if (hasCustomKeys) {
        layoutType = "custom";
      } else {
        layoutType = "premium";
      }
    }
  }

  // FAQ Accordion toggler helper
  const toggleFaq = (key: string) => {
    setFaqOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to safely render image
  const renderImage = (src: string, alt: string, className: string = "w-full h-auto object-cover") => {
    if (!src) return null;
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} transition-all duration-500 hover:scale-[1.02]`}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  };

  // ----------------------------------------------------
  // LAYOUT 1: PREMIUM TEMPLATE
  // ----------------------------------------------------
  const renderPremium = () => {
    const heroTitle = values.heroTitle || "";
    const heroSubtitle = values.heroSubtitle || "";
    const heroImage = values.heroImage || "";
    const featHeading = values.featHeading || values.featuresHeading || "";
    const hasFeatures = ['1', '2', '3', '4', '5'].some(num => values[`feature${num}Title`] || values[`feat${num}Title`]);

    return (
      <div className="space-y-0 bg-white text-slate-900 rounded-3xl overflow-hidden">
        {/* Hero Section */}
        {heroImage && (
          <div className="relative w-full aspect-[21/9]">
            {renderImage(heroImage, heroTitle || "Hero Image", "w-full h-full object-contain transition-transform duration-700")}
            {(heroTitle || heroSubtitle) && (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-955/80 via-slate-955/20 to-transparent flex flex-col justify-center items-center text-center p-6 sm:p-10 text-white">
                {heroTitle && <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">{heroTitle}</h3>}
                {heroSubtitle && <p className="text-xs sm:text-base text-slate-200 mt-2 max-w-xl font-medium drop-shadow-sm">{heroSubtitle}</p>}
              </div>
            )}
          </div>
        )}

        {/* Content sections wrapper with padding */}
        <div className="p-4 sm:p-8 space-y-12">
          {/* Feature Highlights Grid */}
          {hasFeatures && (
            <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-100 max-w-3xl mx-auto text-center space-y-4">
              {featHeading && (
                <div className="space-y-2">
                  <h4 className="text-lg sm:text-xl font-bold text-slate-800">{featHeading}</h4>
                  <div className="w-12 h-1 bg-violet-600 mx-auto rounded-full" />
                </div>
              )}
              <ul className="space-y-4">
                {['1', '2', '3', '4', '5'].map(num => {
                  const title = values[`feature${num}Title`] || values[`feat${num}Title`] || "";
                  const desc = values[`feature${num}Desc`] || values[`feat${num}Desc`] || "";
                  if (!title) return null;
                  return (
                    <li key={num} className="space-y-1">
                      <strong className="block text-slate-800 text-base sm:text-lg">{title}</strong>
                      {desc && <span className="block text-slate-650 text-sm whitespace-pre-line">{desc}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Split Sections */}
          {['1', '2', '3'].map((num, i) => {
            const title = values[`split${num}Title`] || "";
            const text = values[`split${num}Text`] || values[`split${num}Desc`] || "";
            const image = values[`split${num}Image`] || "";
            if (!image && !title) return null;
            return (
              <div key={num} className={`aplus-split flex flex-col md:flex-row gap-8 items-center justify-between pt-6 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                {image && renderImage(image, title || "Split image", "w-full md:w-[40%] max-w-[420px] h-auto hover:scale-[1.01] transition duration-500")}
                <div className="aplus-split-txt w-full md:w-[55%] space-y-3">
                  {title && <h3 className="text-lg sm:text-2xl font-bold text-slate-800">{title}</h3>}
                  {text && <p className="text-sm text-slate-650 leading-relaxed whitespace-pre-line">{text}</p>}
                </div>
              </div>
            );
          })}

          {/* FAQ Accordion */}
          {['1', '2', '3'].some(num => values[`faq${num}Question`]) && (
            <div className="aplus-faq space-y-4 pt-8 max-w-3xl mx-auto w-full">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
                <HelpCircle className="h-5 w-5 text-violet-600" />
                Frequently Asked Questions
              </h3>
              <div className="border border-gray-205 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                {['1', '2', '3'].map(num => {
                  const question = values[`faq${num}Question`] || "";
                  const answer = values[`faq${num}Answer`] || "";
                  if (!question) return null;
                  const isFaqOpen = !!faqOpen[`faq${num}`];
                  return (
                    <div key={num} className="bg-white">
                      <button
                        type="button"
                        onClick={() => toggleFaq(`faq${num}`)}
                        className="w-full flex justify-between items-center p-4 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
                      >
                        <span>{question}</span>
                        {isFaqOpen ? <ChevronUp className="h-4 w-4 text-slate-550" /> : <ChevronDown className="h-4 w-4 text-slate-550" />}
                      </button>
                      {isFaqOpen && answer && (
                        <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-650 leading-relaxed whitespace-pre-line border-t border-slate-50">
                          {answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // LAYOUT 2: DARK LUXURY TEMPLATE
  // ----------------------------------------------------
  const renderDarkLuxury = () => {
    const heroTitle = values.heroTitle || "";
    const heroSubtitle = values.heroSubtitle || "";
    const heroImage = values.heroImage || "";
    const split1Image = values.split1Image || "";
    const split1Title = values.split1Title || "";
    const split1Text = values.split1Text || "";
    const split2Image = values.split2Image || "";
    const split2Title = values.split2Title || "";
    const split2Text = values.split2Text || "";

    return (
      <div className="space-y-12 bg-slate-950 text-slate-100 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-10 font-sans">
        {/* Luxury Badge */}
        <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-amber-955/40 text-amber-400 border border-amber-900/30 rounded-full w-max mx-auto text-xs font-semibold uppercase tracking-widest">
          <Sparkles className="h-3.5 w-3.5" />
          Elite Specification
        </div>

        {/* Hero Section */}
        {heroImage && (
          <div className="relative rounded-2xl overflow-hidden aspect-[21/9] bg-slate-900 group shadow-lg border border-slate-850">
            {renderImage(heroImage, heroTitle || "Luxury Hero Banner", "w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105 opacity-85")}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            {(heroTitle || heroSubtitle) && (
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 text-center items-center">
                {heroTitle && <h3 className="text-xl sm:text-4xl font-light tracking-widest text-white uppercase">{heroTitle}</h3>}
                <div className="w-16 h-[1px] bg-amber-400 my-3" />
                {heroSubtitle && <p className="text-[10px] sm:text-xs text-slate-300 max-w-lg font-light tracking-wide uppercase">{heroSubtitle}</p>}
              </div>
            )}
          </div>
        )}

        {/* Alternating Row 1 */}
        {(split1Image || split1Title || split1Text) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-6">
            {split1Image && (
              <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-850 shadow-md aspect-video">
                {renderImage(split1Image, split1Title || "Luxury Highlight", "w-full h-full object-contain")}
              </div>
            )}
            <div className="space-y-3.5">
              <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">01 / Craftsmanship</span>
              {split1Title && <h4 className="text-lg sm:text-2xl font-light text-slate-100 tracking-wide uppercase">{split1Title}</h4>}
              <div className="w-8 h-[2px] bg-amber-500 rounded" />
              {split1Text && <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">{split1Text}</p>}
            </div>
          </div>
        )}

        {/* Alternating Row 2 */}
        {(split2Image || split2Title || split2Text) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-8 border-t border-slate-850/60">
            <div className="space-y-3.5 md:order-2">
              <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">02 / Design Excellence</span>
              {split2Title && <h4 className="text-lg sm:text-2xl font-light text-slate-100 tracking-wide uppercase">{split2Title}</h4>}
              <div className="w-8 h-[2px] bg-amber-500 rounded" />
              {split2Text && <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">{split2Text}</p>}
            </div>
            {split2Image && (
              <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-850 shadow-md aspect-video md:order-1">
                {renderImage(split2Image, split2Title || "Luxury Feature Details", "w-full h-full object-contain")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // LAYOUT 3: CLEAN MINIMAL TEMPLATE
  // ----------------------------------------------------
  const renderCleanMinimal = () => {
    const heroTitle = values.heroTitle || "";
    const heroImage = values.heroImage || "";

    return (
      <div className="space-y-8 bg-slate-50 text-slate-800 border border-slate-200/60 rounded-3xl p-6 sm:p-10 font-sans">
        {/* Minimal Hero */}
        {heroTitle && (
          <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-center text-slate-900 max-w-xl mx-auto leading-relaxed">
            {heroTitle}
          </h3>
        )}

        {heroImage && (
          <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white p-2 shadow-sm max-w-4xl mx-auto">
            <div className="rounded-xl overflow-hidden aspect-[16/9]">
              {renderImage(heroImage, heroTitle || "Minimal view", "w-full h-full object-cover")}
            </div>
          </div>
        )}

        {/* Dynamic specification list / detail box */}
        {['1', '2', '3', '4', '5'].map(num => {
          const title = values[`feature${num}Title`] || values[`feat${num}Title`] || "";
          const desc = values[`feature${num}Desc`] || values[`feat${num}Desc`] || "";
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
  };

  // ----------------------------------------------------
  // LAYOUT 4: BOLD MODERN TEMPLATE
  // ----------------------------------------------------
  const renderBoldModern = () => {
    const heroTitle = values.heroTitle || "";
    const heroSubtitle = values.heroSubtitle || "";
    const heroImage = values.heroImage || "";

    return (
      <div className="space-y-8 bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-8">
        {/* Header Accent Accent Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1.5 bg-violet-600 rounded-full" />
            <h3 className="text-base font-bold text-slate-900">Modern Layout Overview</h3>
          </div>
          <span className="text-[10px] font-bold text-violet-600 uppercase bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
            Innovative Design
          </span>
        </div>

        {/* Hero Card */}
        {heroImage && (
          <div className="relative rounded-2xl overflow-hidden aspect-[2/1] bg-slate-900 group border border-slate-100">
            {renderImage(heroImage, heroTitle || "Modern Accent Banner", "w-full h-full object-cover transition-all duration-550 group-hover:scale-[1.03] opacity-90")}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-955/80 via-slate-955/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10 max-w-md text-white space-y-2">
              {heroTitle && <h4 className="text-lg sm:text-2xl font-black uppercase tracking-tight">{heroTitle}</h4>}
              {heroSubtitle && <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed">{heroSubtitle}</p>}
            </div>
          </div>
        )}

        {/* Feature Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {['1', '2', '3', '4', '5'].map((num, i) => {
            const title = values[`feature${num}Title`] || values[`feat${num}Title`] || "";
            const desc = values[`feature${num}Desc`] || values[`feat${num}Desc`] || "";
            if (!title) return null;
            const borderCol = i % 2 === 0 ? "border-violet-600" : "border-indigo-600";
            return (
              <div key={num} className={`bg-slate-50 border-l-4 ${borderCol} p-5 rounded-r-2xl space-y-2 hover:bg-slate-100/50 transition`}>
                <h5 className="text-sm sm:text-base font-extrabold text-slate-800 uppercase tracking-tight">{title}</h5>
                <p className="text-xs sm:text-sm text-slate-650 leading-relaxed whitespace-pre-line">{desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // LAYOUT 5: CUSTOM SCHEMA-DRIVEN DYNAMIC FALLBACK
  // ----------------------------------------------------
  const renderCustomFallback = () => {
    return (
      <div className="space-y-8 bg-white text-slate-900 border border-slate-150 rounded-3xl p-5 sm:p-8 shadow-sm">
        {/* Heading */}
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <Layout className="h-5 w-5 text-violet-600" />
          <h4 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">{template.name}</h4>
        </div>

        {template.description && (
          <p className="text-xs text-slate-500 italic max-w-xl -mt-4">{template.description}</p>
        )}

        {/* Render fields in order */}
        <div className="space-y-6">
          {fields.map((field) => {
            const val = values[field.key] || "";
            if (!val) return null;

            if (field.type === "image") {
              return (
                <div key={field.key} className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{field.label}</span>
                  <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm aspect-video max-h-[380px] flex items-center justify-center">
                    {renderImage(val, field.label, "w-full h-full object-cover")}
                  </div>
                </div>
              );
            }

            if (field.type === "textarea") {
              return (
                <div key={field.key} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{field.label}</span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">{val}</p>
                </div>
              );
            }

            return (
              <div key={field.key} className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{field.label}</span>
                <p className="text-sm font-bold text-slate-800">{val}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render correct layout based on computed type
  switch (layoutType) {
    case "darkLuxury":
      return renderDarkLuxury();
    case "cleanMinimal":
      return renderCleanMinimal();
    case "boldModern":
      return renderBoldModern();
    case "custom":
      return renderCustomFallback();
    case "premium":
    default:
      return renderPremium();
  }
}
