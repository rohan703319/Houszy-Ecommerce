'use client';

import productsService from '@/lib/services/products';
import { useState, useEffect, useRef } from 'react';


interface Props {
  value: string;
  onChange: (value: string) => void;
  productId?: string;
  isVariableProduct?: boolean; // SKU optional for variable products
}

// ✅ SKU FORMAT VALIDATION
const validateSkuFormat = (sku: string) => {
  const regex = /^[A-Z0-9-]+$/;

  if (!regex.test(sku)) {
    return {
      isValid: false,
      error: 'Only uppercase letters, numbers and hyphen (-) allowed'
    };
  }

  if (sku.length < 3) {
    return {
      isValid: false,
      error: 'SKU must be at least 3 characters'
    };
  }

  return { isValid: true, error: '' };
};

export default function SKUInput({ value, onChange, productId, isVariableProduct = false }: Props) {
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ CHECK SKU
  const checkSkuExists = async (sku: string) => {
    setError('');

    if (!sku || sku.length < 3) return false;

    const validation = validateSkuFormat(sku);
    if (!validation.isValid) {
      setError(validation.error);
      return true;
    }

    try {
      setChecking(true);

      const res = await productsService.getAll({
        searchTerm: sku
      });

      const items = res.data?.data?.items ?? [];

      const exists = items.some((p: any) =>
        p.sku?.toUpperCase() === sku.toUpperCase() &&
        p.id !== productId
      );

      if (exists) {
        setError('SKU already exists');
        return true;
      }

      return false;

    } catch (err) {
      console.warn('SKU check failed:', err);
      return false;
    } finally {
      setChecking(false);
    }
  };

  // ✅ HANDLE CHANGE
  const handleChange = (input: string) => {
    // sanitize
    const sanitized = input.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    onChange(sanitized);

    if (error) setError('');

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (sanitized.length >= 3) {
      debounceRef.current = setTimeout(() => {
        checkSkuExists(sanitized);
      }, 600);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        SKU (Stock Keeping Unit){' '}
        {isVariableProduct
          ? <span className="text-slate-500 text-xs font-normal">(optional)</span>
          : <span className="text-red-500">*</span>
        }
      </label>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="PROD-001"
          maxLength={30}
          className={`w-full px-4 py-2.5 pr-10 bg-slate-900 border rounded-lg text-white uppercase font-mono transition-all ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : value && !checking && value.length >= 3
              ? 'border-green-500 focus:ring-green-500'
              : 'border-slate-700 focus:ring-violet-500'
          }`}
          required={!isVariableProduct}
        />

        {/* ICON */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">

          {checking && (
            <svg className="animate-spin h-5 w-5 text-violet-400" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            </svg>
          )}

          {!checking && error && (
            <span
              className="text-red-500 cursor-pointer"
              onClick={() => {
                onChange('');
                setError('');
              }}
            >
              ❌
            </span>
          )}

          {!checking && !error && value && value.length >= 3 && (
            <span className="text-green-500">✔</span>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}

      {/* SUCCESS */}
      {!error && value && value.length >= 3 && !checking && (
        <p className="text-green-400 text-xs mt-1">
          SKU is available
        </p>
      )}
    </div>
  );
}