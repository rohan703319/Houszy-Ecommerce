"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Edit, Trash2, ToggleLeft, ToggleRight, X, Save, Loader2,
  Zap, Truck, Package, ShieldCheck, Clock, MapPin, Store,
  CheckCircle, Star, FileText, Layers, ChevronDown, ChevronUp,
  GripVertical, AlignLeft, List, ListChecks, Building2,
  Megaphone, HeadphonesIcon, Hash,
  Bike,
  PackageSearch,
  PackageCheck,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import { apiClient } from "@/lib/api";

// ── Section Types ────────────────────────────────────────────────────────────
type SectionType = "intro" | "steps" | "bullets" | "checklist" | "address" | "cta" | "support";

interface IntroSection    { type: "intro";     content: string; }
interface StepsSection    { type: "steps";     heading: string; steps: { title: string; description: string; }[]; }
interface BulletsSection  { type: "bullets";   heading: string; items: string[]; }
interface ChecklistSection{ type: "checklist"; heading: string; items: { title: string; description: string; }[]; }
interface AddressSection  { type: "address";   heading: string; lines: string[]; hours: string[]; }
interface CtaSection      { type: "cta";       heading: string; content: string; buttonText?: string; buttonLink?: string; }
interface SupportSection  { type: "support";   heading: string; content: string; phone?: string; email?: string; hours?: string; }

type PageSection = IntroSection | StepsSection | BulletsSection | ChecklistSection | AddressSection | CtaSection | SupportSection;

const SECTION_META: Record<SectionType, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  intro:     { label: "Introduction", icon: <AlignLeft size={13}/>,      color: "violet", desc: "Opening paragraph" },
  steps:     { label: "Steps",        icon: <Hash size={13}/>,           color: "cyan",   desc: "Numbered how-it-works" },
  bullets:   { label: "Bullet List",  icon: <List size={13}/>,           color: "emerald",desc: "Simple list (pricing etc.)" },
  checklist: { label: "Checklist",    icon: <ListChecks size={13}/>,     color: "blue",   desc: "Items with descriptions" },
  address:   { label: "Address",      icon: <Building2 size={13}/>,      color: "orange", desc: "Store address + hours" },
  cta:       { label: "Call to Action",icon: <Megaphone size={13}/>,     color: "pink",   desc: "Button / CTA block" },
  support:   { label: "Support",      icon: <HeadphonesIcon size={13}/>, color: "amber",  desc: "Phone, email, hours" },
};

const COLOR_MAP: Record<string, string> = {
  violet:  "bg-violet-500/10 border-violet-500/30 text-violet-400",
  cyan:    "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
  emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  blue:    "bg-blue-500/10 border-blue-500/30 text-blue-400",
  orange:  "bg-orange-500/10 border-orange-500/30 text-orange-400",
  pink:    "bg-pink-500/10 border-pink-500/30 text-pink-400",
  amber:   "bg-amber-500/10 border-amber-500/30 text-amber-400",
};

function createEmptySection(type: SectionType): PageSection {
  switch (type) {
    case "intro":     return { type: "intro", content: "" };
    case "steps":     return { type: "steps", heading: "How It Works", steps: [] };
    case "bullets":   return { type: "bullets", heading: "", items: [] };
    case "checklist": return { type: "checklist", heading: "", items: [] };
    case "address":   return { type: "address", heading: "Our Store", lines: [], hours: [] };
    case "cta":       return { type: "cta", heading: "", content: "", buttonText: "", buttonLink: "" };
    case "support":   return { type: "support", heading: "Need Help?", content: "", phone: "", email: "", hours: "" };
  }
}

function parseJsonToSections(json?: string | null): PageSection[] {
  if (!json) return [];
  try { return JSON.parse(json)?.sections ?? []; } catch { return []; }
}

function sectionsToJson(sections: PageSection[]): string | null {
  return sections.length > 0 ? JSON.stringify({ sections }) : null;
}

// ── Delivery Strip Types ─────────────────────────────────────────────────────
interface FeatureCard { icon: string; heading: string; description: string; }
interface DeliveryStripItem {
  id: string; title: string; subtitle: string; icon: string; slug: string;
  displayOrder: number; isActive: boolean; isDeleted: boolean;
  pageTitle: string; pageSubtitle: string;
  featureCards: FeatureCard[]; infoSectionTitle: string; infoPoints: string[];
  pageContentJson?: string | null;
  createdAt: string; updatedAt?: string;
}

type FormState = {
  title: string; subtitle: string; icon: string; slug: string;
  displayOrder: number; isActive: boolean;
  pageTitle: string; pageSubtitle: string;
  featureCards: FeatureCard[]; infoSectionTitle: string; infoPoints: string[];
  sections: PageSection[];
};

const EMPTY: FormState = {
  title: "", subtitle: "", icon: "Truck", slug: "",
  displayOrder: 1, isActive: true,
  pageTitle: "", pageSubtitle: "",
  featureCards: [], infoSectionTitle: "Important Information",
  infoPoints: [], sections: [],
};

const ICONS = [
  { value: "Truck",       label: "Truck",     el: <Truck size={14}/> },
  { value: "Zap",         label: "Lightning", el: <Zap size={14}/> },
  { value: "Package",     label: "Package",   el: <Package size={14}/> },
  { value: "ShieldCheck", label: "Shield",    el: <ShieldCheck size={14}/> },
  { value: "Clock",       label: "Clock",     el: <Clock size={14}/> },
  { value: "MapPin",      label: "Map Pin",   el: <MapPin size={14}/> },
  { value: "Store",       label: "Store",     el: <Store size={14}/> },
  { value: "CheckCircle", label: "Check",     el: <CheckCircle size={14}/> },
  { value: "Star",        label: "Star",      el: <Star size={14}/> },
    // ✅ NEW
  { value: "PackageCheck",  label: "Delivered",    el: <PackageCheck size={14}/> },
  { value: "PackageSearch", label: "Tracking",     el: <PackageSearch size={14}/> },
  { value: "Bike",          label: "Fast Delivery",el: <Bike size={14}/> },
];

function IconComp({ name, size = 18 }: { name: string; size?: number }) {
  const p = { size };
  const map: Record<string, React.ReactElement> = {
    Truck: <Truck {...p}/>, Zap: <Zap {...p}/>, Package: <Package {...p}/>,
    ShieldCheck: <ShieldCheck {...p}/>, Clock: <Clock {...p}/>,
    MapPin: <MapPin {...p}/>, Store: <Store {...p}/>,
    CheckCircle: <CheckCircle {...p}/>, Star: <Star {...p}/>,
    PackageCheck: <PackageCheck {...p}/>,
PackageSearch: <PackageSearch {...p}/>,
Bike: <Bike {...p}/>,
  };
  return map[name] ?? <Truck {...p}/>;
}

const inputCls = "w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60";
const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5";
const smInputCls = "w-full bg-slate-900/60 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50";

// ── Section Editor ───────────────────────────────────────────────────────────
function SectionEditor({
  section, idx, total,
  onUpdate, onRemove, onMove,
}: {
  section: PageSection; idx: number; total: number;
  onUpdate: (s: PageSection) => void;
  onRemove: () => void;
  onMove: (dir: 1 | -1) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const meta = SECTION_META[section.type];
  const colorCls = COLOR_MAP[meta.color];

  const upd = (patch: Partial<any>) => onUpdate({ ...section, ...patch } as PageSection);

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800/30">
      {/* Card Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/60">
        <GripVertical size={14} className="text-slate-600 flex-shrink-0" />
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${colorCls}`}>
          {meta.icon} {meta.label}
        </span>
        <span className="text-slate-500 text-xs truncate flex-1">
          {section.type === "intro" ? (section as IntroSection).content?.slice(0, 60) || "Empty"
            : (section as any).heading || meta.desc}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={() => onMove(-1)} disabled={idx === 0} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-20 transition">
            <ChevronUp size={13}/>
          </button>
          <button onClick={() => onMove(1)} disabled={idx === total - 1} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-20 transition">
            <ChevronDown size={13}/>
          </button>
          <button onClick={() => setExpanded(e => !e)} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition">
            {expanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition">
            <X size={13}/>
          </button>
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <div className="px-4 py-3 space-y-3">
          {/* INTRO */}
          {section.type === "intro" && (
            <div>
              <label className={labelCls}>Content</label>
              <textarea rows={4} value={(section as IntroSection).content}
                onChange={e => upd({ content: e.target.value })}
                placeholder="Write the introduction paragraph..."
                className={inputCls + " resize-none"} />
            </div>
          )}

          {/* STEPS */}
          {section.type === "steps" && (() => {
            const s = section as StepsSection;
            return <>
              <div>
                <label className={labelCls}>Section Heading</label>
                <input value={s.heading} onChange={e => upd({ heading: e.target.value })}
                  placeholder="e.g. How It Works" className={inputCls} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls + " mb-0"}>Steps ({s.steps.length})</label>
                  <button onClick={() => upd({ steps: [...s.steps, { title: "", description: "" }] })}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                    <Plus size={11}/> Add Step
                  </button>
                </div>
                <div className="space-y-2">
                  {s.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 items-start bg-slate-900/40 border border-slate-700 rounded-lg p-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i+1}</span>
                      <div className="flex-1 space-y-1.5">
                        <input value={step.title} onChange={e => {
                          const steps = [...s.steps]; steps[i] = { ...steps[i], title: e.target.value }; upd({ steps });
                        }} placeholder="Step title" className={smInputCls} />
                        <textarea rows={2} value={step.description} onChange={e => {
                          const steps = [...s.steps]; steps[i] = { ...steps[i], description: e.target.value }; upd({ steps });
                        }} placeholder="Step description..." className={smInputCls + " resize-none"} />
                      </div>
                      <button onClick={() => upd({ steps: s.steps.filter((_, j) => j !== i) })}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition mt-0.5">
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                  {s.steps.length === 0 && <p className="text-xs text-slate-600 text-center py-3">No steps yet. Click "Add Step".</p>}
                </div>
              </div>
            </>;
          })()}

          {/* BULLETS */}
          {section.type === "bullets" && (() => {
            const s = section as BulletsSection;
            return <>
              <div>
                <label className={labelCls}>Section Heading</label>
                <input value={s.heading} onChange={e => upd({ heading: e.target.value })}
                  placeholder="e.g. Delivery Pricing" className={inputCls} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls + " mb-0"}>Items ({s.items.length})</label>
                  <button onClick={() => upd({ items: [...s.items, ""] })}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                    <Plus size={11}/> Add Item
                  </button>
                </div>
                <div className="space-y-1.5">
                  {s.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-emerald-400 text-base leading-none">•</span>
                      <input value={item} onChange={e => {
                        const items = [...s.items]; items[i] = e.target.value; upd({ items });
                      }} placeholder="e.g. £3.95 for orders under £50" className={smInputCls + " flex-1"} />
                      <button onClick={() => upd({ items: s.items.filter((_, j) => j !== i) })}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition">
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                  {s.items.length === 0 && <p className="text-xs text-slate-600 text-center py-3">No items. Click "Add Item".</p>}
                </div>
              </div>
            </>;
          })()}

          {/* CHECKLIST */}
          {section.type === "checklist" && (() => {
            const s = section as ChecklistSection;
            return <>
              <div>
                <label className={labelCls}>Section Heading</label>
                <input value={s.heading} onChange={e => upd({ heading: e.target.value })}
                  placeholder="e.g. Why Choose Us" className={inputCls} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls + " mb-0"}>Items ({s.items.length})</label>
                  <button onClick={() => upd({ items: [...s.items, { title: "", description: "" }] })}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium">
                    <Plus size={11}/> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {s.items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start bg-slate-900/40 border border-slate-700 rounded-lg p-2.5">
                      <CheckCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5"/>
                      <div className="flex-1 space-y-1.5">
                        <input value={item.title} onChange={e => {
                          const items = [...s.items]; items[i] = { ...items[i], title: e.target.value }; upd({ items });
                        }} placeholder="Title" className={smInputCls} />
                        <input value={item.description} onChange={e => {
                          const items = [...s.items]; items[i] = { ...items[i], description: e.target.value }; upd({ items });
                        }} placeholder="Short description..." className={smInputCls} />
                      </div>
                      <button onClick={() => upd({ items: s.items.filter((_, j) => j !== i) })}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition mt-0.5">
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                  {s.items.length === 0 && <p className="text-xs text-slate-600 text-center py-3">No items. Click "Add Item".</p>}
                </div>
              </div>
            </>;
          })()}

          {/* ADDRESS */}
          {section.type === "address" && (() => {
            const s = section as AddressSection;
            return <>
              <div>
                <label className={labelCls}>Section Heading</label>
                <input value={s.heading} onChange={e => upd({ heading: e.target.value })}
                  placeholder="e.g. Our Store" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls + " mb-0"}>Address Lines</label>
                    <button onClick={() => upd({ lines: [...s.lines, ""] })}
                      className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium">
                      <Plus size={11}/> Add
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {s.lines.map((line, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input value={line} onChange={e => {
                          const lines = [...s.lines]; lines[i] = e.target.value; upd({ lines });
                        }} placeholder="Address line..." className={smInputCls + " flex-1"} />
                        <button onClick={() => upd({ lines: s.lines.filter((_, j) => j !== i) })}
                          className="p-1 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400">
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                    {s.lines.length === 0 && <p className="text-xs text-slate-600 py-2">No address lines.</p>}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls + " mb-0"}>Opening Hours</label>
                    <button onClick={() => upd({ hours: [...s.hours, ""] })}
                      className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium">
                      <Plus size={11}/> Add
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {s.hours.map((hour, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input value={hour} onChange={e => {
                          const hours = [...s.hours]; hours[i] = e.target.value; upd({ hours });
                        }} placeholder="e.g. Mon-Fri: 9am-5pm" className={smInputCls + " flex-1"} />
                        <button onClick={() => upd({ hours: s.hours.filter((_, j) => j !== i) })}
                          className="p-1 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400">
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                    {s.hours.length === 0 && <p className="text-xs text-slate-600 py-2">No hours added.</p>}
                  </div>
                </div>
              </div>
            </>;
          })()}

          {/* CTA */}
          {section.type === "cta" && (() => {
            const s = section as CtaSection;
            return <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Heading</label>
                <input value={s.heading} onChange={e => upd({ heading: e.target.value })}
                  placeholder="e.g. Ready to Order?" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Content</label>
                <textarea rows={3} value={s.content} onChange={e => upd({ content: e.target.value })}
                  placeholder="Supporting text under the heading..." className={inputCls + " resize-none"} />
              </div>
              <div>
                <label className={labelCls}>Button Text</label>
                <input value={s.buttonText ?? ""} onChange={e => upd({ buttonText: e.target.value })}
                  placeholder="e.g. Shop Now" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Button Link</label>
                <input value={s.buttonLink ?? ""} onChange={e => upd({ buttonLink: e.target.value })}
                  placeholder="e.g. /products" className={inputCls} />
              </div>
            </div>;
          })()}

          {/* SUPPORT */}
          {section.type === "support" && (() => {
            const s = section as SupportSection;
            return <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Heading</label>
                <input value={s.heading} onChange={e => upd({ heading: e.target.value })}
                  placeholder="e.g. Need Help?" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Content</label>
                <textarea rows={2} value={s.content} onChange={e => upd({ content: e.target.value })}
                  placeholder="Support description..." className={inputCls + " resize-none"} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={s.phone ?? ""} onChange={e => upd({ phone: e.target.value })}
                  placeholder="e.g. 0800 123 456" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input value={s.email ?? ""} onChange={e => upd({ email: e.target.value })}
                  placeholder="e.g. help@example.com" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Hours</label>
                <input value={s.hours ?? ""} onChange={e => upd({ hours: e.target.value })}
                  placeholder="e.g. Mon-Fri 9am-5pm" className={inputCls} />
              </div>
            </div>;
          })()}
        </div>
      )}
    </div>
  );
}

// ── Add Section Picker ───────────────────────────────────────────────────────
function AddSectionPicker({ onAdd }: { onAdd: (t: SectionType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full border-2 border-dashed border-slate-700 hover:border-violet-500/50 rounded-xl py-3 px-4 text-sm text-slate-500 hover:text-violet-400 transition">
        <Plus size={15}/> Add Section
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
          <p className="text-xs text-slate-500 px-3 pt-2.5 pb-1.5 font-medium">Choose section type</p>
          {(Object.entries(SECTION_META) as [SectionType, typeof SECTION_META[SectionType]][]).map(([type, meta]) => (
            <button key={type} onClick={() => { onAdd(type); setOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2 hover:bg-slate-800 transition text-left">
              <span className={`flex items-center justify-center w-6 h-6 rounded-md border ${COLOR_MAP[meta.color]}`}>
                {meta.icon}
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-300">{meta.label}</p>
                <p className="text-xs text-slate-600">{meta.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DeliveryStripPage() {
  const toast = useToast();
  const [items,        setItems]        = useState<DeliveryStripItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [activeTab,    setActiveTab]    = useState<"strip" | "page" | "rich">("strip");
  const [editing,      setEditing]      = useState<DeliveryStripItem | null>(null);
  const [form,         setForm]         = useState<FormState>({ ...EMPTY });
  const [deleteTarget, setDeleteTarget] = useState<DeliveryStripItem | null>(null);
 const [toggleTarget, setToggleTarget] = useState<DeliveryStripItem | null>(null);
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>("/api/DeliveryStrip/admin");
      if (res.data?.success) setItems(res.data.data ?? []);
      else toast.error(res.data?.message || "Failed to load delivery strip items");
    } catch { toast.error("Failed to load delivery strip items"); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, displayOrder: items.length + 1 });
    setActiveTab("strip");
    setShowModal(true);
  };

  const openEdit = (item: DeliveryStripItem) => {
    setEditing(item);
    setForm({
      title: item.title, subtitle: item.subtitle, icon: item.icon,
      slug: item.slug, displayOrder: item.displayOrder, isActive: item.isActive,
      pageTitle: item.pageTitle, pageSubtitle: item.pageSubtitle,
      featureCards: item.featureCards ?? [],
      infoSectionTitle: item.infoSectionTitle ?? "Important Information",
      infoPoints: item.infoPoints ?? [],
      sections: parseJsonToSections(item.pageContentJson),
    });
    setActiveTab("strip");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim())  { toast.error("Slug is required");  return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        sections: undefined,
        pageContentJson: sectionsToJson(form.sections),
      };
      let res: any;
      if (editing) res = await apiClient.put<any>(`/api/DeliveryStrip/${editing.id}`, payload);
      else         res = await apiClient.post<any>("/api/DeliveryStrip", payload);

      if (res.data?.success) {
        toast.success(editing ? "Updated successfully" : "Created successfully");
        setShowModal(false);
        fetchItems();
      } else {
        toast.error(res.data?.message || res.error || "Save failed");
      }
    } catch { toast.error("Save failed"); }
    finally  { setSaving(false); }
  };

const handleToggle = async () => {
  if (!toggleTarget) return;

  try {
    const res = await apiClient.patch<any>(`/api/DeliveryStrip/${toggleTarget.id}/toggle`);
    if (res.data?.success) {
      toast.success(res.data.message || "Updated");
      setToggleTarget(null);
      fetchItems();
    } else {
      toast.error(res.data?.message || "Toggle failed");
    }
  } catch {
    toast.error("Toggle failed");
  }
};

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiClient.delete<any>(`/api/DeliveryStrip/${deleteTarget.id}`);
      if (res.data?.success) { toast.success("Deleted"); setDeleteTarget(null); fetchItems(); }
      else toast.error(res.data?.message || "Delete failed");
    } catch { toast.error("Delete failed"); }
  };

  // Feature card helpers
  const addCard  = () => setForm(f => ({ ...f, featureCards: [...f.featureCards, { icon: "Clock", heading: "", description: "" }] }));
  const updCard  = (i: number, k: keyof FeatureCard, v: string) =>
    setForm(f => { const c = [...f.featureCards]; c[i] = { ...c[i], [k]: v }; return { ...f, featureCards: c }; });
  const remCard  = (i: number) => setForm(f => ({ ...f, featureCards: f.featureCards.filter((_, j) => j !== i) }));

  // Info point helpers
  const addPoint = () => setForm(f => ({ ...f, infoPoints: [...f.infoPoints, ""] }));
  const updPoint = (i: number, v: string) =>
    setForm(f => { const pts = [...f.infoPoints]; pts[i] = v; return { ...f, infoPoints: pts }; });
  const remPoint = (i: number) => setForm(f => ({ ...f, infoPoints: f.infoPoints.filter((_, j) => j !== i) }));

  // Section helpers
  const addSection    = (type: SectionType) => setForm(f => ({ ...f, sections: [...f.sections, createEmptySection(type)] }));
  const updateSection = (i: number, s: PageSection) => setForm(f => { const arr = [...f.sections]; arr[i] = s; return { ...f, sections: arr }; });
  const removeSection = (i: number) => setForm(f => ({ ...f, sections: f.sections.filter((_, j) => j !== i) }));
  const moveSection   = (i: number, dir: 1 | -1) => setForm(f => {
    const arr = [...f.sections]; const j = i + dir;
    if (j < 0 || j >= arr.length) return f;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...f, sections: arr };
  });

  const handleTitleChange = (val: string) =>
    setForm(f => ({
      ...f, title: val,
      slug: editing ? f.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));

  const active   = items.filter(i => i.isActive).length;
  const withRich = items.filter(i => i.pageContentJson).length;

  const TABS = [
    { id: "strip", label: "Strip Bar" },
    { id: "page",  label: "Page Content" },
    { id: "rich",  label: `Page Sections (${form.sections.length})` },
  ] as const;

  return (
    <div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck size={20} className="text-violet-400" /> Delivery Strip
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the delivery info bar and individual delivery pages.
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-violet-500/20">
          <Plus size={15}/> Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        {[
          { label: "Total",         value: items.length,          color: "text-white" },
          { label: "Active",        value: active,                color: "text-emerald-400" },
          { label: "Inactive",      value: items.length - active, color: "text-slate-400" },
          { label: "Has Rich Page", value: withRich,              color: "text-cyan-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="animate-spin text-violet-400" size={28}/>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-slate-900/50 border border-slate-800 rounded-xl">
          <Truck size={40} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium text-slate-400">No delivery strip items yet.</p>
          <p className="text-xs mt-1">Click "Add Item" to create the first one.</p>
        </div>
      ) : (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800">
              <tr>
                {["#", "Item", "Slug", "Page", "Status", "Actions"].map((h, i) => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide ${i === 2 ? "hidden md:table-cell" : ""} ${i === 3 ? "hidden lg:table-cell" : ""} ${i === 5 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((item, idx) => (
                <tr key={item.id} className={`hover:bg-slate-800/40 transition ${!item.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                        <IconComp name={item.icon}/>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.subtitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-mono text-xs bg-slate-800/80 text-cyan-400 px-2 py-0.5 rounded border border-slate-700">/delivery/{item.slug}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-xs">
                      {item.pageContentJson ? (
                        <span className="flex items-center gap-1 text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                          <FileText size={10}/> Rich Content
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500 bg-slate-800/60 border border-slate-700 px-2 py-0.5 rounded-full">
                          <Layers size={10}/> Basic Only
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      item.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-800/60 text-slate-500 border-slate-700"
                    }`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setToggleTarget(item)} title={item.isActive ? "Deactivate" : "Activate"}
                        className="p-1.5 rounded-lg hover:bg-slate-700/60 transition">
                        {item.isActive
                          ? <ToggleRight size={18} className="text-emerald-400"/>
                          : <ToggleLeft  size={18} className="text-slate-500"/>}
                      </button>
                      <button onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-500 hover:text-cyan-400 transition">
                        <Edit size={15}/>
                      </button>
                      <button onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition">
                        <Trash2 size={15}/>
                      </button>
                      <a
  href={`/delivery/${item.slug}`}
  target="_blank"
  rel="noopener noreferrer"
  title="View Page"
  className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-500 hover:text-green-400 transition"
>
  <ExternalLink size={15} />
</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-3xl max-h-[95vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-white">
                  {editing ? "Edit Delivery Strip Item" : "Add New Delivery Strip Item"}
                </h2>
                {editing && <p className="text-xs text-slate-500 mt-0.5 font-mono">/delivery/{editing.slug}</p>}
              </div>
              <button onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition">
                <X size={16}/>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 px-6 gap-1 flex-shrink-0">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* TAB 1: Strip Bar */}
              {activeTab === "strip" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelCls}>Title <span className="text-red-400">*</span></label>
                      <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                        placeholder="e.g. NEXT DAY DELIVERY" className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Subtitle</label>
                      <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                        placeholder="e.g. Order before 3PM for next day" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Icon</label>
                      <div className="grid grid-cols-3 gap-2">
                        {ICONS.map(ic => (
                          <button key={ic.value} type="button" onClick={() => setForm(f => ({ ...f, icon: ic.value }))}
                            className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-xs transition ${
                              form.icon === ic.value
                                ? "border-violet-500/60 bg-violet-500/10 text-violet-400 font-semibold"
                                : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                            }`}>
                            {ic.el} {ic.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Display Order</label>
                        <input type="number" min={1} value={form.displayOrder}
                          onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 1 }))}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Slug <span className="text-red-400">*</span></label>
                        <div className="flex items-center bg-slate-800/60 border border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/40">
                          <span className="px-3 py-2 bg-slate-700/60 text-xs text-slate-500 border-r border-slate-700 whitespace-nowrap">/delivery/</span>
                          <input value={form.slug}
                            onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                            placeholder="next-day" className="flex-1 px-3 py-2 text-sm bg-transparent text-white placeholder-slate-500 focus:outline-none" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700 rounded-lg">
                        <input type="checkbox" id="isActive" checked={form.isActive}
                          onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                          className="rounded w-4 h-4 accent-violet-500" />
                        <label htmlFor="isActive" className="text-sm text-slate-300 font-medium cursor-pointer">Active — visible on site</label>
                      </div>
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Strip Bar Preview</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                        <IconComp name={form.icon} size={20}/>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white tracking-wide">{form.title || "TITLE"}</p>
                        <p className="text-xs text-slate-400">{form.subtitle || "Subtitle text here"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: Page Content */}
              {activeTab === "page" && (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={labelCls}>Page Title</label>
                      <input value={form.pageTitle} onChange={e => setForm(f => ({ ...f, pageTitle: e.target.value }))}
                        placeholder="e.g. Next Day Delivery" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Page Subtitle</label>
                      <textarea rows={2} value={form.pageSubtitle}
                        onChange={e => setForm(f => ({ ...f, pageSubtitle: e.target.value }))}
                        placeholder="Short description shown under the page title..."
                        className={inputCls + " resize-none"} />
                    </div>
                  </div>

                  {/* Feature Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-slate-400">Feature Cards ({form.featureCards.length})</p>
                      <button onClick={addCard} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition">
                        <Plus size={12}/> Add Card
                      </button>
                    </div>
                    <div className="space-y-3">
                      {form.featureCards.map((card, i) => (
                        <div key={i} className="border border-slate-700 rounded-xl p-3 bg-slate-800/40 space-y-2">
                          <div className="flex items-center gap-2">
                            <select value={card.icon} onChange={e => updCard(i, "icon", e.target.value)}
                              className="border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none w-32">
                              {ICONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <input value={card.heading} onChange={e => updCard(i, "heading", e.target.value)}
                              placeholder="Card Heading"
                              className="flex-1 border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none" />
                            <button onClick={() => remCard(i)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition">
                              <X size={13}/>
                            </button>
                          </div>
                          <textarea rows={2} value={card.description} onChange={e => updCard(i, "description", e.target.value)}
                            placeholder="Card description..."
                            className="w-full border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none resize-none" />
                        </div>
                      ))}
                      {form.featureCards.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-slate-700 rounded-xl text-slate-600 text-xs">
                          No feature cards. Click "Add Card".
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>Info Section Title</label>
                      <input value={form.infoSectionTitle}
                        onChange={e => setForm(f => ({ ...f, infoSectionTitle: e.target.value }))}
                        placeholder="e.g. Important Information" className={inputCls} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-400">Bullet Points ({form.infoPoints.length})</p>
                        <button onClick={addPoint} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition">
                          <Plus size={12}/> Add Point
                        </button>
                      </div>
                      <div className="space-y-2">
                        {form.infoPoints.map((pt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-violet-400 text-sm">•</span>
                            <input value={pt} onChange={e => updPoint(i, e.target.value)}
                              placeholder="Enter bullet point..."
                              className="flex-1 border border-slate-700 bg-slate-800/60 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none" />
                            <button onClick={() => remPoint(i)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition">
                              <X size={13}/>
                            </button>
                          </div>
                        ))}
                        {form.infoPoints.length === 0 && (
                          <div className="text-center py-6 border-2 border-dashed border-slate-700 rounded-xl text-slate-600 text-xs">
                            No bullet points yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 3: Page Sections (visual builder) */}
              {activeTab === "rich" && (
                <div className="space-y-3">
                  {form.sections.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      <Layers size={32} className="mx-auto mb-2 opacity-30"/>
                      <p>No sections yet.</p>
                      <p className="text-xs mt-1 text-slate-600">Click "Add Section" below to build the page.</p>
                    </div>
                  )}
                  {form.sections.map((section, i) => (
                    <SectionEditor
                      key={i}
                      section={section}
                      idx={i}
                      total={form.sections.length}
                      onUpdate={s => updateSection(i, s)}
                      onRemove={() => removeSection(i)}
                      onMove={dir => moveSection(i, dir)}
                    />
                  ))}
                  <AddSectionPicker onAdd={addSection} />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl flex-shrink-0">
              <p className="text-xs text-slate-600">
                {editing
                  ? `Last updated: ${editing.updatedAt ? new Date(editing.updatedAt).toLocaleDateString() : "never"}`
                  : "New item"}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-slate-300 transition">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-40 shadow-lg shadow-violet-500/20">
                  {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
      <ConfirmDialog
  isOpen={!!deleteTarget}
  title="Delete Delivery Strip Item"
  message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
  onConfirm={handleDelete}
  onClose={() => setDeleteTarget(null)}
/>
      )}

      {toggleTarget && (
  <ConfirmDialog
    isOpen={!!toggleTarget}
    title={toggleTarget.isActive ? "Deactivate Item" : "Activate Item"}
    message={`Are you sure you want to ${
      toggleTarget.isActive ? "deactivate" : "activate"
    } "${toggleTarget.title}"?`}
    onConfirm={handleToggle}
    onClose={() => setToggleTarget(null)}
  />
)}
    </div>
  );
}
