'use client';

import React from 'react';
import { Plus, Trash, Sparkles, Shield, Package, Lock, HelpCircle, FileText } from 'lucide-react';
import { ProductFeature } from '@/lib/services/products';

interface FeaturesManagerProps {
  features: ProductFeature[];
  onChange: (features: ProductFeature[]) => void;
}

const EMOJI_SUGGESTIONS = ['🔒', '📦', '🛡️', '🍃', '💧', '✨', '🔥', '👍'];
const LUCIDE_SUGGESTIONS = ['Shield', 'Package', 'Lock', 'Sparkles', 'Truck', 'Heart', 'Award', 'Clock'];

const HOUSZY_ICONS = [
  { name: 'Airtight Seal', path: '/features/airtight.png' },
  { name: 'Compact', path: '/features/compact.png' },
  { name: 'Durable', path: '/features/durable.png' },
  { name: 'Non-Stick', path: '/features/non-stick.png' },
  { name: 'Cooktop', path: '/features/cooktop.png' },
  { name: 'Adaptable', path: '/features/adaptable.png' },
  { name: 'Optimal', path: '/features/optimal.png' },
  { name: 'Hasslefree', path: '/features/hasslefree.png' },
  { name: 'Durability', path: '/features/durability.png' },
];

export default function FeaturesManager({ features, onChange }: FeaturesManagerProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeSuggestionsId, setActiveSuggestionsId] = React.useState<string | null>(null);

  // Keep a stable ref of onChange to prevent dependency cycles in useEffect
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Ensure we have at least 3 features on mount/update
  React.useEffect(() => {
    if (features.length < 3) {
      const newFeatures = [...features];
      while (newFeatures.length < 3) {
        newFeatures.push({
          id: `temp-${crypto.randomUUID()}`,
          icon: '',
          title: '',
          description: '',
          sortOrder: newFeatures.length + 1,
        });
      }
      onChangeRef.current(newFeatures);
    }
  }, [features.length]);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let cachedScrollParent: HTMLElement | null = null;

    const getScrollParent = (): HTMLElement => {
      if (cachedScrollParent) return cachedScrollParent;

      let parent = container.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;
        const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
        const canScroll = parent.scrollHeight > parent.clientHeight;

        if (isScrollable && canScroll) {
          cachedScrollParent = parent;
          return parent;
        }
        parent = parent.parentElement;
      }

      cachedScrollParent = document.documentElement;
      return document.documentElement;
    };

    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const delta = e.deltaY;

      // Check if we are scrolling up and already at the top
      const isAtTop = delta < 0 && scrollTop <= 0;
      // Check if we are scrolling down and already at the bottom
      const isAtBottom = delta > 0 && scrollTop + clientHeight >= scrollHeight - 1;

      if (isAtTop || isAtBottom) {
        const target = getScrollParent();
        target.scrollTop += delta;
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [features]);

  const handleAdd = () => {
    const newFeature: ProductFeature = {
      id: `temp-${crypto.randomUUID()}`,
      icon: '',
      title: '',
      description: '',
      sortOrder: features.length + 1,
    };
    onChange([...features, newFeature]);
  };

  const handleRemove = (id: string) => {
    const filtered = features.filter((f) => f.id !== id);
    // Re-index sortOrder to be 1-based sequential integers: 1, 2, 3...
    const sorted = [...filtered].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const updated = sorted.map((f, idx) => ({ ...f, sortOrder: idx + 1 }));
    onChange(updated);
  };

  const handleUpdate = (id: string, field: keyof ProductFeature, value: any) => {
    const updated = features.map((f) => {
      if (f.id === id) {
        return { ...f, [field]: value };
      }
      return f;
    });
    onChange(updated);
  };

  const handleSortOrderChange = (id: string, value: string) => {
    const parsed = parseInt(value, 10);
    const updatedValue = isNaN(parsed) ? 1 : parsed;
    handleUpdate(id, 'sortOrder', updatedValue);
  };

  return (
    <div className="space-y-4 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Product Features
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Add key feature visual cards (e.g. Airtight Seal, Compact & Practical) displayed on the details page.
          </p>
        </div>
      </div>

      {features.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-slate-800 rounded-xl text-center">
          <HelpCircle className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-sm text-slate-400 font-medium">No features added yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Add highlights like Airtight Seal, Eco-Friendly, or Premium Material to show visual cards on the store page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div ref={scrollContainerRef} className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {[...features]
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((feature, idx) => (
                <div
                  key={feature.id}
                  className="group relative bg-slate-850/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 md:p-4 transition-all duration-250 flex flex-col md:flex-row gap-4 items-start"
                >
                  {/* Edit Fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 w-full items-start">
                    {/* Icon Field */}
                    <div className="md:col-span-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold text-slate-400">Icon / Emoji</label>
                        <button
                          type="button"
                          onClick={() => setActiveSuggestionsId(activeSuggestionsId === feature.id ? null : feature.id)}
                          className="text-[10px] text-violet-400 hover:text-violet-300 font-medium transition-colors cursor-pointer"
                        >
                          {activeSuggestionsId === feature.id ? 'Hide Icons' : 'Show Icons'}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-9 h-9 shrink-0 bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-center text-lg font-bold select-none text-violet-400 overflow-hidden p-1">
                          {feature.icon.startsWith('/') || feature.icon.startsWith('http') ? (
                            <img src={feature.icon} alt="Preview" className="w-full h-full object-contain" />
                          ) : /\p{Emoji}/u.test(feature.icon) && feature.icon.length <= 4 ? (
                            feature.icon
                          ) : (
                            <span className="text-xs font-mono truncate max-w-full">{feature.icon.slice(0, 3)}</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={feature.icon}
                          onChange={(e) => handleUpdate(feature.id, 'icon', e.target.value)}
                          onFocus={() => setActiveSuggestionsId(feature.id)}
                          placeholder="Emoji, Lucide name or URL"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-violet-500 focus:border-transparent outline-none h-9"
                        />
                      </div>

                      {/* Quick suggestions - collapsible inline panel */}
                      {activeSuggestionsId === feature.id && (
                        <div className="mt-2 bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 space-y-2.5 animate-fadeIn">
                          {/* Houszy Custom Icons */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">Houszy Icons</span>
                            <div className="flex flex-wrap gap-1">
                              {HOUSZY_ICONS.map((icon) => (
                                <button
                                  key={icon.path}
                                  type="button"
                                  onClick={() => handleUpdate(feature.id, 'icon', icon.path)}
                                  className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded flex items-center gap-1 text-[10px] text-slate-300 hover:text-white transition-all cursor-pointer"
                                  title={icon.name}
                                >
                                  <img src={icon.path} alt={icon.name} className="w-3 h-3 object-contain shrink-0" />
                                  <span className="text-[9px]">{icon.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Emojis */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">Emojis</span>
                            <div className="flex flex-wrap gap-1">
                              {EMOJI_SUGGESTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleUpdate(feature.id, 'icon', emoji)}
                                  className="w-5 h-5 flex items-center justify-center text-xs bg-slate-950 hover:bg-slate-800 rounded text-white transition-all cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Lucide */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">Lucide</span>
                            <div className="flex flex-wrap gap-1">
                              {LUCIDE_SUGGESTIONS.map((icon) => (
                                <button
                                  key={icon}
                                  type="button"
                                  onClick={() => handleUpdate(feature.id, 'icon', icon)}
                                  className="px-1 py-0.5 text-[9px] bg-slate-950 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-all cursor-pointer font-mono"
                                >
                                  {icon}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Title Field */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-400">Title</label>
                      <input
                        type="text"
                        value={feature.title}
                        onChange={(e) => handleUpdate(feature.id, 'title', e.target.value)}
                        placeholder="e.g. Airtight Seal"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-violet-500 focus:border-transparent outline-none h-9"
                        required
                      />
                    </div>

                    {/* Sort Order Field */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-400">Sort Order</label>
                      <input
                        type="number"
                        value={feature.sortOrder}
                        onChange={(e) => handleSortOrderChange(feature.id, e.target.value)}
                        placeholder="e.g. 1"
                        min="1"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-violet-500 focus:border-transparent outline-none h-9"
                        required
                      />
                    </div>

                    {/* Description Field */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-400">Short Description</label>
                      <textarea
                        value={feature.description}
                        onChange={(e) => handleUpdate(feature.id, 'description', e.target.value)}
                        placeholder="Explain this feature highlight..."
                        rows={1}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-violet-500 focus:border-transparent outline-none resize-none min-h-[36px] max-h-[72px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="self-end md:self-center shrink-0">
                    <button
                      type="button"
                      disabled={features.length <= 3}
                      onClick={() => handleRemove(feature.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove Feature"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer w-full justify-center md:w-auto shadow-md"
            >
              <Plus className="w-4 h-4 text-violet-400" />
              Add More Features
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
