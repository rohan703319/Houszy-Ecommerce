'use client';

import React from 'react';
import { Plus, Trash, ArrowUp, ArrowDown, Sparkles, Shield, Package, Lock, HelpCircle, FileText } from 'lucide-react';
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
];

export default function FeaturesManager({ features, onChange }: FeaturesManagerProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

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
      icon: '✨',
      title: '',
      description: '',
      sortOrder: features.length,
    };
    onChange([...features, newFeature]);
  };

  const handleRemove = (id: string) => {
    const filtered = features.filter((f) => f.id !== id);
    // Re-index sortOrder
    const updated = filtered.map((f, idx) => ({ ...f, sortOrder: idx }));
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

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === features.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newFeatures = [...features];
    
    // Swap items
    const temp = newFeatures[index];
    newFeatures[index] = newFeatures[targetIndex];
    newFeatures[targetIndex] = temp;

    // Update sortOrder properties
    const reindexed = newFeatures.map((f, idx) => ({
      ...f,
      sortOrder: idx,
    }));

    onChange(reindexed);
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
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-violet-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Feature
        </button>
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
        <div ref={scrollContainerRef} className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {features
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((feature, idx) => (
              <div
                key={feature.id}
                className="group relative bg-slate-850/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition-all duration-250 flex flex-col md:flex-row gap-4 items-start"
              >
                {/* Drag / Sort Handles */}
                <div className="flex md:flex-col gap-1 w-full md:w-auto justify-between md:justify-start items-center border-b md:border-b-0 border-slate-800/40 pb-2 md:pb-0">
                  <div className="flex md:flex-col gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded text-slate-400 hover:text-white transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === features.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded text-slate-400 hover:text-white transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 md:mt-2">
                    #{idx + 1}
                  </span>
                </div>

                {/* Edit Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 w-full">
                  {/* Icon Field */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400">Icon / Emoji</label>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 shrink-0 bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-center text-xl font-bold select-none text-violet-400 overflow-hidden p-1">
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
                        placeholder="Emoji, Lucide name or URL"
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-violet-500 focus:border-transparent outline-none"
                      />
                    </div>

                    {/* Quick suggestions */}
                    <div className="space-y-2 pt-1">
                      {/* Houszy Custom Icons */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">Houszy Icons</span>
                        <div className="flex flex-wrap gap-1">
                          {HOUSZY_ICONS.map((icon) => (
                            <button
                              key={icon.path}
                              type="button"
                              onClick={() => handleUpdate(feature.id, 'icon', icon.path)}
                              className="px-1.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded flex items-center gap-1 text-[10px] text-slate-300 hover:text-white transition-all cursor-pointer"
                              title={icon.name}
                            >
                              <img src={icon.path} alt={icon.name} className="w-3.5 h-3.5 object-contain" />
                              <span>{icon.name}</span>
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
                              className="w-6 h-6 flex items-center justify-center text-xs bg-slate-900/50 hover:bg-slate-800 rounded text-white transition-all cursor-pointer"
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
                              className="px-1 py-0.5 text-[9px] bg-slate-900/50 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all cursor-pointer font-mono"
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title Field */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400">Title</label>
                    <input
                      type="text"
                      value={feature.title}
                      onChange={(e) => handleUpdate(feature.id, 'title', e.target.value)}
                      placeholder="e.g. Airtight Seal"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-violet-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  {/* Description Field */}
                  <div className="md:col-span-6 space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400">Short Description</label>
                    <textarea
                      value={feature.description}
                      onChange={(e) => handleUpdate(feature.id, 'description', e.target.value)}
                      placeholder="Explain this feature highlight..."
                      rows={2}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
                      required
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <div className="self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleRemove(feature.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-lg transition-all cursor-pointer"
                    title="Remove Feature"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
