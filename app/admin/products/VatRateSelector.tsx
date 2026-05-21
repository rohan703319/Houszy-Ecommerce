"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { vatratesService } from "@/lib/services/vatrates";

type VatRate = {
  id: string;
  name: string;
  description?: string;
  rate: number;
  isDefault?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
};

type Props<T extends { vatRateId: string; vatExempt: boolean }> = {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
};

export default function VatRateSelector<
  T extends { vatRateId: string; vatExempt: boolean }
>({
  formData,
  setFormData,
}: Props<T>) {
  const [vatRates, setVatRates] = useState<VatRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  /* =====================================================
     FETCH VAT RATES
     1. Edit => existing vatRateId preserve
     2. Add => default auto select
  ===================================================== */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const res = await vatratesService.getAll();

        const rows =
          res?.data?.data ||
          res?.data ||
          [];

        if (Array.isArray(rows)) {
          const filtered = rows.filter(
            (x: VatRate) =>
              (x.isActive ?? true) &&
              !(x.isDeleted ?? false)
          );

          setVatRates(filtered);

          // Auto default select only if empty
          if (!formData.vatRateId && filtered.length > 0) {
            const defaultRate =
              filtered.find((x) => x.isDefault) || filtered[0];

            setFormData((prev) => ({
              ...prev,
              vatRateId: defaultRate.id,
              vatExempt: defaultRate.rate === 0,
            }));
          }
        }
      } catch (error) {
        console.error("VAT rates fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* =====================================================
     OUTSIDE CLICK
  ===================================================== */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  /* =====================================================
     FILTER
  ===================================================== */
  const filteredRates = useMemo(() => {
    const txt = search.toLowerCase().trim();

    if (!txt) return vatRates;

    return vatRates.filter(
      (item) =>
        item.name.toLowerCase().includes(txt) ||
        item.rate.toString().includes(txt) ||
        item.description?.toLowerCase().includes(txt)
    );
  }, [search, vatRates]);

  /* =====================================================
     SELECTED
  ===================================================== */
  const selectedRate = vatRates.find(
    (x) => x.id === formData.vatRateId
  );

  /* =====================================================
     SELECT HANDLER
     0% => exempt true
  ===================================================== */
  const handleSelect = (item: VatRate) => {
    setFormData((prev) => ({
      ...prev,
      vatRateId: item.id,
      vatExempt: item.rate === 0,
    }));

    setOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-3" ref={wrapperRef}>
      <label className="block text-sm font-medium text-slate-300">
        VAT Rate <span className="text-red-400">*</span>
      </label>

      {/* INPUT */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search VAT rate..."
          value={
            open
              ? search
              : selectedRate
              ? `${selectedRate.name} (${selectedRate.rate}%)`
              : ""
          }
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 pr-24 text-white outline-none focus:ring-2 focus:ring-violet-500"
        />

        {!open && selectedRate?.isDefault && (
          <span className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full border border-emerald-500/20 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
            Default
          </span>
        )}

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          ▼
        </button>
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="max-h-72 overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
          {loading ? (
            <div className="p-3 text-sm text-slate-400">
              Loading...
            </div>
          ) : filteredRates.length === 0 ? (
            <div className="p-3 text-sm text-slate-400">
              No VAT rate found
            </div>
          ) : (
            filteredRates.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full border-b border-slate-800 px-3 py-2 text-left hover:bg-slate-800 ${
                  formData.vatRateId === item.id
                    ? "bg-violet-500/20"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">
                      {item.name}
                    </span>

                    {item.isDefault && (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                        Default
                      </span>
                    )}
                  </div>

                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      item.rate === 0
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {item.rate}%
                  </span>
                </div>

                {item.description && (
                  <p className="mt-1 text-xs text-slate-400">
                    {item.description}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* STATUS */}
      {selectedRate && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            formData.vatExempt
              ? "border-green-500/20 bg-green-500/10 text-green-400"
              : "border-blue-500/20 bg-blue-500/10 text-blue-400"
          }`}
        >
          {formData.vatExempt
            ? "VAT Exempt = true"
            : "VAT Exempt = false"}
        </div>
      )}
    </div>
  );
}