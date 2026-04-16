'use client';

import { productsService } from '@/lib/services';
import { useState, useRef } from 'react';


interface Props {
  value: string;
  onChange: (value: string) => void;
  productId?: string; // edit mode ke liye
}

export default function ProductNameInput({
  value,
  onChange,
  productId
}: Props) {
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ✅ API CHECK
  const checkName = async (name: string) => {
    if (!name || name.length < 3) return;

    try {
      setChecking(true);

      const res = await productsService.getAll({
        searchTerm: name.trim()
      });

      const items = res.data?.data?.items ?? [];

      const exists = items.some((p: any) =>
        p.name?.toLowerCase().trim() === name.toLowerCase().trim() &&
        p.id !== productId
      );

      if (exists) {
        setError('Product name already exists');
      } else {
        setError('');
      }

    } catch (err) {
      console.warn('Name check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  // ✅ HANDLE CHANGE
  const handleChange = (val: string) => {
    onChange(val);

    if (error) setError('');

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (val.length >= 3) {
      debounceRef.current = setTimeout(() => {
        checkName(val);
      }, 300);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Product Name <span className="text-red-500">*</span>
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter product name"
          className={`w-full px-3 py-2.5 pr-10 bg-slate-800/50 border rounded-xl text-white transition-all ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : value && !checking && value.length >= 3
              ? 'border-green-500 focus:ring-green-500'
              : 'border-slate-700 focus:ring-violet-500'
          }`}
          required
          minLength={3}
          maxLength={150}
        />

        {/* RIGHT ICON */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm flex items-center gap-1">
          {checking && (
            <span className="text-yellow-400 animate-pulse">...</span>
          )}

          {!checking && error && (
            <span
              className="text-red-500 cursor-pointer"
              onClick={() => {
                onChange('');
                setError('');

                if (debounceRef.current) {
                  clearTimeout(debounceRef.current);
                }

                inputRef.current?.focus();
              }}
            >
              ❌
            </span>
          )}

          {!checking && !error && value.length >= 3 && (
            <span className="text-green-500">✔</span>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}

      {/* SUCCESS */}
      {!error && value.length >= 3 && !checking && (
        <p className="text-green-400 text-xs mt-1">
          Product name is available
        </p>
      )}
    </div>
  );
}