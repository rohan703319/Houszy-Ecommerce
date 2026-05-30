'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ProductFeature } from '@/lib/services/products';

interface ProductFeaturesProps {
  features?: ProductFeature[];
}

export function DynamicIcon({ icon, className = "h-12 w-12 text-[#f38918]" }: { icon: string; className?: string }) {
  if (!icon) return null;

  // 1. Emoji detection
  const isEmoji = /\p{Emoji}/u.test(icon) && icon.length <= 4;
  if (isEmoji) {
    return <span className={`text-4xl inline-block select-none leading-none ${className}`}>{icon}</span>;
  }

  // 2. Image URL detection
  if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/')) {
    return <img src={icon} alt="Feature Icon" className={`object-contain ${className}`} />;
  }

  // 3. Lucide icon name lookup
  const LucideIcon = (LucideIcons as any)[icon];
  if (LucideIcon) {
    return <LucideIcon className={className} strokeWidth={1.5} />;
  }

  // 4. Case-insensitive/kebab-case Lucide lookup (e.g. shield-check -> ShieldCheck)
  const pascalCase = icon
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const LucideIconPascal = (LucideIcons as any)[pascalCase];
  if (LucideIconPascal) {
    return <LucideIconPascal className={className} strokeWidth={1.5} />;
  }

  // 5. Fallback
  return <span className="text-xl font-bold font-mono">{icon.slice(0, 2)}</span>;
}

export default function ProductFeatures({ features }: ProductFeaturesProps) {
  if (!features || features.length === 0) return null;

  // Sort by sortOrder
  const sortedFeatures = [...features].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="w-full my-12 px-4 sm:px-6">
      <div 
        className="bg-[#f7f7f7] py-14 px-8 sm:px-12 md:px-16 lg:px-24 mx-auto max-w-6xl transition-all duration-300 hover:shadow-sm"
        style={{ 
          clipPath: 'polygon(60px 0px, 100% 0px, 100% calc(100% - 60px), calc(100% - 60px) 100%, 0px 100%, 0px 60px)' 
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">
          {sortedFeatures.map((feature) => (
            <div 
              key={feature.id} 
              className="flex flex-col items-center text-center space-y-4 px-2 group"
            >
              {/* Icon Container */}
              <div className="h-16 w-16 flex items-center justify-center bg-transparent group-hover:scale-110 transition-transform duration-300">
                <DynamicIcon icon={feature.icon} className="h-12 w-12 text-[#f38918]" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 leading-tight">
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
