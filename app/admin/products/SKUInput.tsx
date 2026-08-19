'use client';

import productsService from '@/lib/services/products';
import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  productId?: string;
  isVariableProduct?: boolean;
  disabled?: boolean;
  onErrorChange?: (hasError: boolean) => void;
  onCheckingChange?: (checking: boolean) => void;
}

const validateSkuFormat = (sku: string) => {
  const regex = /^[A-Z0-9-]+$/;

  if (!regex.test(sku)) {
    return { isValid: false, error: 'Only uppercase letters, numbers and hyphen (-) allowed' };
  }

  if (sku.length < 3) {
    return { isValid: false, error: 'SKU must be at least 3 characters' };
  }

  return { isValid: true, error: '' };
};

export default function SKUInput({
  value,
  onChange,
  productId,
  isVariableProduct = false,
  disabled = false,
  onErrorChange,
  onCheckingChange
}: Props) {
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedRef = useRef<string>(''); // ✅ cache
  const requestIdRef = useRef(0); // ✅ prevent race

  const isDisabled = isVariableProduct || disabled;

  useEffect(() => {
    onErrorChange?.(isDisabled ? false : !!error);
  }, [error, isDisabled]);

  useEffect(() => {
    onCheckingChange?.(isDisabled ? false : checking);
  }, [checking, isDisabled]);

  const checkSkuExists = async (sku: string) => {
    if (isDisabled) return;
    if (lastCheckedRef.current === sku) return;
    lastCheckedRef.current = sku;

    const currentRequestId = ++requestIdRef.current;

    try {
      setChecking(true);

      const res = await productsService.searchSummary({
        sku: sku.trim(),
        ...(productId ? { excludeProductId: productId } : {}),
      });

      if (currentRequestId !== requestIdRef.current) return;

      const exists = res.data?.data?.skuFound ?? false;

      setError(exists ? 'SKU already exists' : '');

    } catch (err) {
      console.warn(err);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setChecking(false);
      }
    }
  };

  const handleChange = (input: string) => {
    if (isDisabled) return;
    const sanitized = input.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    onChange(sanitized);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // ✅ format validation first (no API)
    const validation = validateSkuFormat(sanitized);
    if (!validation.isValid) {
      setError(sanitized ? validation.error : '');
      return;
    }

    if (sanitized.length >= 3) {
      debounceRef.current = setTimeout(() => {
        checkSkuExists(sanitized);
      }, 300); // ⬅ faster
    } else {
      setError('');
    }
  };

  return (
    <div>
      <label className="block text-sm text-slate-300 mb-2">
        SKU{' '}
        {isDisabled
          ? <span className="text-xs text-amber-400 font-normal">(Auto-managed per variant)</span>
          : <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          value={isDisabled ? '' : value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isDisabled}
          placeholder={isDisabled ? 'Disabled for Variable Product' : 'PROD-001'}
          className={`w-full px-4 py-2 pr-10 rounded-lg bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900/80 ${
            error && !isDisabled ? 'border-red-500' : 'border-slate-700'
          }`}
        />

        {!isDisabled && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {checking && <span className="text-yellow-400 animate-pulse">...</span>}
            {!checking && error && <span className="text-red-500">❌</span>}
            {!checking && !error && value.length >= 3 && <span className="text-green-500">✔</span>}
          </div>
        )}
      </div>

      {!isDisabled && error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      {!isDisabled && !error && value.length >= 3 && !checking && (
        <p className="text-green-400 text-xs mt-1">SKU is available</p>
      )}
    </div>
  );
}