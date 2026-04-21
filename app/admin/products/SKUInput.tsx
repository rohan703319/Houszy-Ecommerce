'use client';

import productsService from '@/lib/services/products';
import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  productId?: string;
  isVariableProduct?: boolean;
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
  onErrorChange,
  onCheckingChange
}: Props) {
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedRef = useRef<string>(''); // ✅ cache
  const requestIdRef = useRef(0); // ✅ prevent race

  useEffect(() => {
    onErrorChange?.(!!error);
  }, [error]);

  useEffect(() => {
    onCheckingChange?.(checking);
  }, [checking]);

const checkSkuExists = async (sku: string) => {
  if (lastCheckedRef.current === sku) return;
  lastCheckedRef.current = sku;

  const currentRequestId = ++requestIdRef.current;

  try {
    setChecking(true);

    const res = await productsService.searchSummary({
      sku: sku.trim(),
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
        {isVariableProduct
          ? <span className="text-xs text-slate-500">(optional)</span>
          : <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="PROD-001"
          className={`w-full px-4 py-2 pr-10 rounded-lg bg-slate-800 text-white ${
            error ? 'border-red-500' : 'border-slate-700'
          }`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {checking && <span className="text-yellow-400 animate-pulse">...</span>}
          {!checking && error && <span className="text-red-500">❌</span>}
          {!checking && !error && value.length >= 3 && <span className="text-green-500">✔</span>}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      {!error && value.length >= 3 && !checking && (
        <p className="text-green-400 text-xs mt-1">SKU is available</p>
      )}
    </div>
  );
}