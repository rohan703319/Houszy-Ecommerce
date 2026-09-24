"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Truck, Plus, Edit, Trash2, X, Check, AlertTriangle, MapPin,
  PackageCheck, Clock, PoundSterling, Zap, ShoppingBag, AlertCircle, Eye,
  ChevronDown, ChevronRight, Calendar, Star, ShieldCheck, Sun, Moon, Info, Settings, Ship
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";
import { useToast } from "@/app/admin/_components/CustomToast";
import {
  Carrier,
  DeliveryOption,
  DeliveryService,
  NonWorkingDay,
  PostcodeRule,
  DeliveryOptionCategory
} from "@/lib/types/shipping";

const CATEGORY_MAP: Record<number | string, { name: string; label: string; color: string; icon: React.ReactNode }> = {
  1: { name: "Standard", label: "Standard", color: "violet", icon: <Truck className="w-4 h-4 text-violet-400" /> },
  2: { name: "NextDay", label: "Next Day", color: "amber", icon: <Zap className="w-4 h-4 text-amber-400" /> },
  3: { name: "SameDay", label: "Same Day", color: "cyan", icon: <Zap className="w-4 h-4 text-cyan-400" /> },
  4: { name: "ClickAndCollect", label: "Click & Collect", color: "emerald", icon: <ShoppingBag className="w-4 h-4 text-emerald-400" /> },
  Standard: { name: "Standard", label: "Standard", color: "violet", icon: <Truck className="w-4 h-4 text-violet-400" /> },
  NextDay: { name: "NextDay", label: "Next Day", color: "amber", icon: <Zap className="w-4 h-4 text-amber-400" /> },
  SameDay: { name: "SameDay", label: "Same Day", color: "cyan", icon: <Zap className="w-4 h-4 text-cyan-400" /> },
  ClickAndCollect: { name: "ClickAndCollect", label: "Click & Collect", color: "emerald", icon: <ShoppingBag className="w-4 h-4 text-emerald-400" /> },
};

const emptyService: Omit<DeliveryService, "id"> = {
  deliveryOptionId: "",
  carrierId: null,
  name: "",
  displayName: "",
  carrierName: "",
  description: "",
  price: 0,
  freeShippingThreshold: undefined,
  deliveryMinDays: 1,
  deliveryMaxDays: 2,
  cutoffTime: "13:00",
  isSaturdayWorking: false,
  isSundayWorking: false,
  postcodeSurchargeOverride: undefined,
  isDefault: false,
  isActive: true,
  displayOrder: 0
};

const emptyHoliday: Omit<NonWorkingDay, "id"> = {
  date: new Date().toISOString().split("T")[0],
  name: "",
  isRecurringYearly: false,
  isActive: true,
  notes: ""
};

const emptyRule: Omit<PostcodeRule, "id"> = {
  postcodePattern: "",
  ruleType: "Surcharge",
  surchargeAmount: 0,
  notes: "",
  isActive: true
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  };
  const token = typeof window !== "undefined"
    ? (localStorage.getItem("authToken") || localStorage.getItem("accessToken") || getCookie("authToken") || getCookie("accessToken"))
    : null;
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });
  if (!res.ok) {
    let errText = "";
    try {
      const errJson = await res.json();
      errText = errJson.message || errJson.error || JSON.stringify(errJson);
    } catch {
      errText = await res.text() || `HTTP ${res.status}`;
    }
    throw new Error(errText);
  }
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

const inpClass = "w-full px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all";

function SwitchToggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 select-none">
      {label && <span className="text-xs font-medium text-slate-300">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-gradient-to-r from-violet-500 to-cyan-500" : "bg-slate-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function ShippingPage() {
  const [tab, setTab] = useState<"delivery" | "postcodes" | "settings">("delivery");

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Shipping
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Manage delivery options and postcode rules
        </p>
      </div>

      {/* Tabs matching Screenshot 1 */}
      <div className="flex gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl p-1 w-fit">
        {[
          { id: "delivery", label: "Delivery Options", icon: <PackageCheck className="w-3.5 h-3.5" /> },
          { id: "postcodes", label: "Postcode Rules", icon: <MapPin className="w-3.5 h-3.5" /> },
          { id: "settings", label: "Settings", icon: <Settings className="w-3.5 h-3.5" /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t.id
                ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "delivery" && <DeliveryTab />}
      {tab === "postcodes" && <PostcodeTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. DELIVERY TAB (Options & Nested Services)
// ══════════════════════════════════════════════════════════════════════════════

function DeliveryTab() {
  const toast = useToast();
  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOptionIds, setExpandedOptionIds] = useState<Record<string, boolean>>({});

  // Option Modal State
  const [optionModal, setOptionModal] = useState(false);
  const [editingOption, setEditingOption] = useState<DeliveryOption | null>(null);
  const [optionNameInput, setOptionNameInput] = useState("");
  const [optionCategoryInput, setOptionCategoryInput] = useState<DeliveryOptionCategory>("Standard");
  const [savingOption, setSavingOption] = useState(false);

  // Service Modal State
  const [serviceModal, setServiceModal] = useState(false);
  const [selectedParentOption, setSelectedParentOption] = useState<DeliveryOption | null>(null);
  const [editingService, setEditingService] = useState<DeliveryService | null>(null);
  const [serviceForm, setServiceForm] = useState<Omit<DeliveryService, "id">>(emptyService);
  const [savingService, setSavingService] = useState(false);

  // Carrier Management State
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [carrierModal, setCarrierModal] = useState(false);
  const [carrierView, setCarrierView] = useState<"list" | "form">("list");
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [carrierForm, setCarrierForm] = useState({ name: "", trackingUrl: "", isActive: true });
  const [savingCarrier, setSavingCarrier] = useState(false);
  const [carrierError, setCarrierError] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    load();
    loadCarriers();
  }, []);

  async function loadCarriers() {
    try {
      const data = await apiFetch<Carrier[]>(`${API_ENDPOINTS.carriers}?includeInactive=true`);
      setCarriers(Array.isArray(data) ? data : []);
    } catch {
      setCarriers([]);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<DeliveryOption[]>(`${API_ENDPOINTS.deliveryOptions}?includeInactive=true`);
      const list = Array.isArray(data) ? data : [];
      setOptions(list);
      // Expand all by default
      const exp: Record<string, boolean> = {};
      list.forEach(o => { exp[o.id] = true; });
      setExpandedOptionIds(exp);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedOptionIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalCarrierServices = useMemo(() => {
    return options.reduce((sum, opt) => sum + (opt.deliveryServices?.length || 0), 0);
  }, [options]);

  // Option actions
  function openCreateOption() {
    setEditingOption(null);
    setOptionNameInput("");
    setOptionCategoryInput("Standard");
    setError("");
    setOptionModal(true);
  }

  function openEditOption(o: DeliveryOption) {
    setEditingOption(o);
    setOptionNameInput(o.displayName || o.name);
    setOptionCategoryInput(o.category ?? "Standard");
    setError("");
    setOptionModal(true);
  }

  async function saveOption() {
    if (!optionNameInput.trim()) {
      setError("Please enter a name for this delivery option.");
      return;
    }
    setSavingOption(true);
    setError("");
    try {
      const catVal = typeof optionCategoryInput === "string"
        ? (optionCategoryInput === "NextDay" ? 2 : optionCategoryInput === "SameDay" ? 3 : optionCategoryInput === "ClickAndCollect" ? 4 : 1)
        : optionCategoryInput;

      const body = {
        name: optionNameInput.trim(),
        displayName: optionNameInput.trim(),
        category: catVal,
        description: null,
        price: 0,
        freeShippingThreshold: null,
        deliveryMinDays: 1,
        deliveryMaxDays: 3,
        isActive: true,
        displayOrder: options.length
      };

      if (editingOption) {
        await apiFetch(`${API_ENDPOINTS.deliveryOptions}/${editingOption.id}`, {
          method: "PUT",
          body: JSON.stringify({ id: editingOption.id, ...body })
        });
        toast.success("Delivery Option updated!");
      } else {
        await apiFetch(API_ENDPOINTS.deliveryOptions, {
          method: "POST",
          body: JSON.stringify(body)
        });
        toast.success("Delivery Option created!");
      }
      setOptionModal(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to save option.");
    } finally {
      setSavingOption(false);
    }
  }

  async function removeOption(id: string, name: string) {
    if (!confirm(`Delete option "${name}" and all its carrier services?`)) return;
    try {
      await apiFetch(`${API_ENDPOINTS.deliveryOptions}/${id}`, { method: "DELETE" });
      toast.success("Option deleted!");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete option.");
    }
  }

  // Carrier actions
  function openManageCarriers() {
    setEditingCarrier(null);
    setCarrierView("list");
    setCarrierForm({ name: "", trackingUrl: "", isActive: true });
    setCarrierError("");
    setCarrierModal(true);
  }

  function startAddCarrier() {
    setEditingCarrier(null);
    setCarrierView("form");
    setCarrierForm({ name: "", trackingUrl: "", isActive: true });
    setCarrierError("");
  }

  function startEditCarrier(c: Carrier) {
    setEditingCarrier(c);
    setCarrierView("form");
    setCarrierForm({
      name: c.name,
      trackingUrl: c.trackingUrl || "",
      isActive: c.isActive
    });
    setCarrierError("");
  }

  function cancelCarrierForm() {
    setEditingCarrier(null);
    setCarrierView("list");
    setCarrierForm({ name: "", trackingUrl: "", isActive: true });
    setCarrierError("");
  }

  async function saveCarrier() {
    if (!carrierForm.name.trim()) {
      setCarrierError("Carrier name is required.");
      return;
    }
    setSavingCarrier(true);
    setCarrierError("");
    try {
      if (editingCarrier) {
        await apiFetch(`${API_ENDPOINTS.carriers}/${editingCarrier.id}`, {
          method: "PUT",
          body: JSON.stringify({
            id: editingCarrier.id,
            name: carrierForm.name.trim(),
            trackingUrl: carrierForm.trackingUrl.trim() || null,
            isActive: carrierForm.isActive
          })
        });
        toast.success("Carrier updated!");
      } else {
        await apiFetch(API_ENDPOINTS.carriers, {
          method: "POST",
          body: JSON.stringify({
            name: carrierForm.name.trim(),
            trackingUrl: carrierForm.trackingUrl.trim() || null,
            isActive: carrierForm.isActive
          })
        });
        toast.success("Carrier created!");
      }
      cancelCarrierForm();
      await loadCarriers();
      await load();
    } catch (e: any) {
      setCarrierError(e.message || "Failed to save carrier.");
    } finally {
      setSavingCarrier(false);
    }
  }

  async function removeCarrier(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete carrier "${name}"?`)) return;
    try {
      await apiFetch(`${API_ENDPOINTS.carriers}/${id}`, { method: "DELETE" });
      toast.success("Carrier deleted!");
      await loadCarriers();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete carrier.");
    }
  }

  function openCreateService(opt: DeliveryOption) {
    setSelectedParentOption(opt);
    setEditingService(null);
    const cat = typeof opt.category === "number"
      ? (opt.category === 2 ? "NextDay" : opt.category === 3 ? "SameDay" : opt.category === 4 ? "ClickAndCollect" : "Standard")
      : (opt.category || "Standard");

    const defaultMin = cat === "NextDay" ? 1 : cat === "SameDay" ? 0 : cat === "ClickAndCollect" ? 1 : 2;
    const defaultMax = cat === "NextDay" ? 1 : cat === "SameDay" ? 0 : cat === "ClickAndCollect" ? 2 : 3;
    const defaultPrice = cat === "ClickAndCollect" ? 0 : cat === "NextDay" ? 6.99 : 3.49;

    const activeCarriers = carriers.filter(c => c.isActive);
    const firstCarrier = activeCarriers.length > 0 ? activeCarriers[0] : null;

    setServiceForm({
      ...emptyService,
      deliveryOptionId: opt.id,
      carrierId: firstCarrier?.id || null,
      carrierName: firstCarrier?.name || "",
      name: "",
      displayName: "",
      price: defaultPrice,
      freeShippingThreshold: undefined,
      postcodeSurchargeOverride: undefined,
      deliveryMinDays: defaultMin,
      deliveryMaxDays: defaultMax,
      cutoffTime: "13:00",
      isSaturdayWorking: false,
      isSundayWorking: false,
      isActive: true,
      isDefault: (opt.deliveryServices?.length || 0) === 0,
      displayOrder: (opt.deliveryServices?.length || 0)
    });
    setError("");
    setServiceModal(true);
  }

  function openEditService(opt: DeliveryOption, s: DeliveryService) {
    setSelectedParentOption(opt);
    setEditingService(s);

    const matchedCarrier = carriers.find(
      c => (s.carrierId && c.id === s.carrierId) ||
           (s.carrierName && c.name.trim().toLowerCase() === s.carrierName.trim().toLowerCase())
    );

    setServiceForm({
      deliveryOptionId: s.deliveryOptionId,
      carrierId: matchedCarrier?.id || s.carrierId || null,
      carrierName: matchedCarrier?.name || s.carrierName,
      name: s.name,
      displayName: s.displayName,
      description: s.description ?? "",
      price: s.price,
      freeShippingThreshold: s.freeShippingThreshold,
      deliveryMinDays: s.deliveryMinDays,
      deliveryMaxDays: s.deliveryMaxDays,
      cutoffTime: s.cutoffTime ?? "13:00",
      isSaturdayWorking: s.isSaturdayWorking,
      isSundayWorking: s.isSundayWorking,
      postcodeSurchargeOverride: s.postcodeSurchargeOverride,
      isDefault: s.isDefault,
      isActive: s.isActive,
      displayOrder: s.displayOrder
    });
    setError("");
    setServiceModal(true);
  }

  async function saveService() {
    if (!serviceForm.name.trim()) {
      setError("Service Name is required.");
      return;
    }
    if (!serviceForm.carrierName?.trim() && !serviceForm.carrierId) {
      setError("Carrier selection is required.");
      return;
    }
    if (!selectedParentOption) return;

    setSavingService(true);
    setError("");
    try {
      const selectedCarrier = carriers.find(c => c.id === serviceForm.carrierId);
      const carrierName = (selectedCarrier ? selectedCarrier.name : serviceForm.carrierName || "").trim();
      const serviceName = serviceForm.name.trim();
      const displayName = `${carrierName} ${serviceName}`.trim();
      const body = {
        deliveryOptionId: selectedParentOption.id,
        carrierId: serviceForm.carrierId || null,
        carrierName: carrierName,
        name: serviceName,
        displayName: displayName,
        price: Number(serviceForm.price) || 0,
        freeShippingThreshold: serviceForm.freeShippingThreshold !== undefined && serviceForm.freeShippingThreshold !== null && !isNaN(Number(serviceForm.freeShippingThreshold))
          ? Number(serviceForm.freeShippingThreshold)
          : null,
        postcodeSurchargeOverride: serviceForm.postcodeSurchargeOverride !== undefined && serviceForm.postcodeSurchargeOverride !== null && serviceForm.postcodeSurchargeOverride.toString().trim() !== "" && !isNaN(Number(serviceForm.postcodeSurchargeOverride))
          ? Number(serviceForm.postcodeSurchargeOverride)
          : null,
        deliveryMinDays: Number(serviceForm.deliveryMinDays) || 1,
        deliveryMaxDays: Number(serviceForm.deliveryMaxDays) || 2,
        cutoffTime: serviceForm.cutoffTime || "13:00",
        isSaturdayWorking: !!serviceForm.isSaturdayWorking,
        isSundayWorking: !!serviceForm.isSundayWorking,
        isActive: !!serviceForm.isActive,
        isDefault: !!serviceForm.isDefault,
        displayOrder: Number(serviceForm.displayOrder) || 0,
        description: null
      };

      if (editingService) {
        await apiFetch(`${API_ENDPOINTS.deliveryServices}/${editingService.id}`, {
          method: "PUT",
          body: JSON.stringify({ id: editingService.id, ...body })
        });
        toast.success("Carrier service updated!");
      } else {
        await apiFetch(API_ENDPOINTS.deliveryServices, {
          method: "POST",
          body: JSON.stringify(body)
        });
        toast.success("Carrier service created!");
      }
      setServiceModal(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to save service.");
    } finally {
      setSavingService(false);
    }
  }

  async function removeService(id: string, name: string) {
    if (!confirm(`Delete carrier service "${name}"?`)) return;
    try {
      await apiFetch(`${API_ENDPOINTS.deliveryServices}/${id}`, { method: "DELETE" });
      toast.success("Service deleted!");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete service.");
    }
  }

  const sorted = [...options].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-4">
      {/* Top Stat Cards & Add Option Button matching Screenshot 1 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Total Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 min-w-[140px] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Total</p>
              <p className="text-xl font-bold text-white mt-0.5">{options.length}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Carrier Services Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 min-w-[160px] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Carrier Services</p>
              <p className="text-xl font-bold text-white mt-0.5">{totalCarrierServices}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openManageCarriers}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Truck className="w-3.5 h-3.5 text-orange-600 dark:text-cyan-400" /> Manage Carriers
          </button>

          <button
            onClick={openCreateOption}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/10 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Option
          </button>
        </div>
      </div>

      {/* Options List Header */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Options
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : options.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-xl">
            <PackageCheck className="w-9 h-9 mx-auto mb-2 text-slate-600" />
            <p className="text-slate-300 text-sm font-semibold">No delivery options yet</p>
            <p className="text-slate-500 text-xs mt-1">Create your first delivery speed tier (Standard, Next Day, etc.)</p>
            <button onClick={openCreateOption} className="mt-3 text-violet-400 hover:text-violet-300 text-xs font-medium">
              + Add Option
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(opt => {
              const isExpanded = !expandedOptionIds[opt.id];
              const catInfo = CATEGORY_MAP[opt.category] || CATEGORY_MAP.Standard;
              const services = opt.deliveryServices ?? [];

              // Pure dynamic metrics calculated directly from database records
              const minPrice = services.length > 0 ? Math.min(...services.map(s => s.price)) : (opt.price ?? 0);
              const minDays = services.length > 0 ? Math.min(...services.map(s => s.deliveryMinDays)) : (opt.deliveryMinDays ?? 1);
              const maxDays = services.length > 0 ? Math.max(...services.map(s => s.deliveryMaxDays)) : (opt.deliveryMaxDays ?? 3);
              const daysLabel = minDays === maxDays ? `${minDays}d` : `${minDays}-${maxDays}d`;
              const priceLabel = minPrice === 0 ? "Free" : `from £${minPrice.toFixed(2)}`;
              const serviceCountLabel = `${services.length} ${services.length === 1 ? "service" : "services"}`;
              const descriptionText = opt.description ? ` · ${opt.description}` : "";

              return (
                <div key={opt.id} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  {/* Option Header Card */}
                  <div
                    onClick={() => toggleExpand(opt.id)}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Active Indicator Dot */}
                      <span className={`w-2 h-2 rounded-full ${opt.isActive ? "bg-emerald-500" : "bg-slate-600"}`} />

                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center">
                        {catInfo.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-bold">{opt.displayName || opt.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-${catInfo.color}-500/10 text-${catInfo.color}-400 border border-${catInfo.color}-500/20`}>
                            {catInfo.label}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {serviceCountLabel} · {priceLabel} · {daysLabel}{descriptionText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openEditOption(opt)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Option"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeOption(opt.id, opt.displayName || opt.name)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExpand(opt.id)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Carrier Services Section */}
                  {isExpanded && (
                    <div className="p-3.5 bg-slate-950/40 border-t border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-semibold text-slate-400">
                          Carrier services under {opt.displayName || opt.name}
                        </span>
                        <button
                          onClick={() => openCreateService(opt)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Service
                        </button>
                      </div>

                      {services.length === 0 ? (
                        <div className="py-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                          No carrier services under this option yet.
                          <button
                            onClick={() => openCreateService(opt)}
                            className="block mx-auto mt-1.5 text-cyan-400 hover:text-cyan-300 font-medium"
                          >
                            + Add Service (e.g. Evri Tracked 48hr)
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {services.map(s => {
                            const title = s.carrierName && s.name ? `${s.carrierName} ${s.name}` : (s.displayName || s.name);

                            return (
                              <div
                                key={s.id}
                                className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-xl flex items-center justify-between hover:border-slate-700/80 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  {/* Dot */}
                                  <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-slate-600"}`} />

                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-white text-xs font-bold">{title}</span>
                                      {s.isDefault && (
                                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                          ⭐ Default
                                        </span>
                                      )}
                                      <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-semibold">
                                        {s.price === 0 ? "Free" : `£${s.price.toFixed(2)}`}
                                      </span>
                                      {s.freeShippingThreshold !== null && s.freeShippingThreshold !== undefined && (
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
                                          Free over £{s.freeShippingThreshold}
                                        </span>
                                      )}
                                      {s.postcodeSurchargeOverride !== null && s.postcodeSurchargeOverride !== undefined && (
                                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold">
                                          Restricted postcodes {Number(s.postcodeSurchargeOverride) === 0 ? "FREE" : `£${Number(s.postcodeSurchargeOverride).toFixed(2)}`}
                                        </span>
                                      )}
                                      <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded">
                                        {s.deliveryMinDays}-{s.deliveryMaxDays} d
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                                      <span>Cutoff: <strong className="text-slate-300">{s.cutoffTime || "13:00"}</strong></span>
                                      <span>•</span>
                                      <span>Saturday: {s.isSaturdayWorking ? <strong className="text-emerald-400">Yes</strong> : "No"}</span>
                                      <span>•</span>
                                      <span>Sunday: {s.isSundayWorking ? <strong className="text-emerald-400">Yes</strong> : "No"}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => openEditService(opt, s)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Edit Service"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => removeService(s.id, title)}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Delete Service"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>



      {/* ── MODAL: Add / Edit Delivery Option (Screenshot 1 Exact Match) ── */}
      {optionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-base font-bold text-white">
                {editingOption ? "Edit Delivery Option" : "Add Delivery Option"}
              </h3>
              <button
                onClick={() => setOptionModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Field 1: What should we call it? */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  What should we call it?
                </label>
                <input
                  type="text"
                  className={inpClass}
                  placeholder="e.g. Next Day Delivery"
                  value={optionNameInput}
                  onChange={e => setOptionNameInput(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Field 2: Category (2x2 Grid) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "Standard", label: "Standard", icon: <Truck className="w-4 h-4" /> },
                    { id: "NextDay", label: "Next Day", icon: <Zap className="w-4 h-4" /> },
                    { id: "SameDay", label: "Same Day", icon: <Zap className="w-4 h-4" /> },
                    { id: "ClickAndCollect", label: "Click & Collect", icon: <ShoppingBag className="w-4 h-4" /> },
                  ].map(cat => {
                    const isSelected = optionCategoryInput === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setOptionCategoryInput(cat.id as DeliveryOptionCategory)}
                        className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium border transition-all text-left ${
                          isSelected
                            ? "bg-slate-800 border-violet-500 text-white ring-1 ring-violet-500"
                            : "bg-slate-950/60 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:text-white"
                        }`}
                      >
                        <span className={isSelected ? "text-violet-400" : "text-slate-400"}>
                          {cat.icon}
                        </span>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Price, free-shipping threshold, delivery days and cutoff time are set per carrier <strong>Service</strong> — expand this option after creating it and click &quot;Add Service&quot;.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOptionModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveOption}
                disabled={savingOption}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {savingOption ? "Saving..." : editingOption ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add / Edit Carrier Service (Screenshot 2 Exact Match) ── */}
      {serviceModal && selectedParentOption && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-base font-bold text-white">
                {editingService
                  ? `Edit Carrier Service — ${selectedParentOption.displayName || selectedParentOption.name}`
                  : `Add Carrier Service — ${selectedParentOption.displayName || selectedParentOption.name}`}
              </h3>
              <button
                onClick={() => setServiceModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-3.5">
              {/* Row 1: Carrier Name & Service Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">Carrier *</label>
                    <button
                      type="button"
                      onClick={() => openManageCarriers()}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline"
                    >
                      + Manage
                    </button>
                  </div>
                  {carriers.length === 0 ? (
                    <input
                      type="text"
                      className={inpClass}
                      placeholder="e.g. Evri, Royal Mail"
                      value={serviceForm.carrierName}
                      onChange={e => setServiceForm({ ...serviceForm, carrierName: e.target.value })}
                    />
                  ) : (
                    <select
                      className={inpClass}
                      value={serviceForm.carrierId || ""}
                      onChange={e => {
                        const selectedId = e.target.value;
                        const found = carriers.find(c => c.id === selectedId);
                        setServiceForm({
                          ...serviceForm,
                          carrierId: selectedId || null,
                          carrierName: found ? found.name : ""
                        });
                      }}
                    >
                      <option value="">Select a carrier...</option>
                      {carriers.filter(c => c.isActive || c.id === serviceForm.carrierId).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {!c.isActive ? "(Inactive)" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Service Name *</label>
                  <input
                    type="text"
                    className={inpClass}
                    placeholder="e.g. Tracked 48hr Service"
                    value={serviceForm.name}
                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Price & Free Shipping Over */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inpClass}
                    placeholder="0 = free"
                    value={serviceForm.price === 0 ? "" : serviceForm.price}
                    onChange={e => setServiceForm({ ...serviceForm, price: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Free Shipping Over (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inpClass}
                    placeholder="Blank = disabled"
                    value={serviceForm.freeShippingThreshold ?? ""}
                    onChange={e => setServiceForm({ ...serviceForm, freeShippingThreshold: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
              </div>

              {/* Row 3: Restricted Postcode Surcharge Override */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Restricted Postcode Surcharge Override (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inpClass}
                  placeholder="Blank = use the postcode rule's default surcharge"
                  value={serviceForm.postcodeSurchargeOverride ?? ""}
                  onChange={e => setServiceForm({ ...serviceForm, postcodeSurchargeOverride: e.target.value !== "" ? parseFloat(e.target.value) : undefined })}
                />
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Only applies on postcodes with a &quot;Surcharge&quot; rule. Leave blank to charge this service&apos;s usual store-wide surcharge. Enter 0 to make this service free on those postcodes, or a custom amount to charge this service&apos;s own surcharge instead of the default.
                </p>
              </div>

              {/* Row 4: Min Days & Max Days */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Min Days</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 2"
                    className={inpClass}
                    value={serviceForm.deliveryMinDays === undefined || serviceForm.deliveryMinDays === null ? "" : serviceForm.deliveryMinDays}
                    onChange={e => setServiceForm({ ...serviceForm, deliveryMinDays: e.target.value === "" ? 0 : parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Days</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3"
                    className={inpClass}
                    value={serviceForm.deliveryMaxDays === undefined || serviceForm.deliveryMaxDays === null ? "" : serviceForm.deliveryMaxDays}
                    onChange={e => setServiceForm({ ...serviceForm, deliveryMaxDays: e.target.value === "" ? 0 : parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Row 5: Cutoff Time & Display Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cutoff Time (order-by)</label>
                  <div className="relative">
                    <input
                      type="time"
                      className={inpClass}
                      value={serviceForm.cutoffTime || "13:00"}
                      onChange={e => setServiceForm({ ...serviceForm, cutoffTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    className={inpClass}
                    value={serviceForm.displayOrder}
                    onChange={e => setServiceForm({ ...serviceForm, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Row 6: Works Saturdays / Works Sundays Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <SwitchToggle
                  checked={serviceForm.isSaturdayWorking}
                  onChange={v => setServiceForm({ ...serviceForm, isSaturdayWorking: v })}
                  label="Works Saturdays"
                />
                <SwitchToggle
                  checked={serviceForm.isSundayWorking}
                  onChange={v => setServiceForm({ ...serviceForm, isSundayWorking: v })}
                  label="Works Sundays"
                />
              </div>

              {/* Row 7: Active Toggle */}
              <div className="pt-1">
                <SwitchToggle
                  checked={serviceForm.isActive}
                  onChange={v => setServiceForm({ ...serviceForm, isActive: v })}
                  label="Active"
                />
              </div>

              {/* Row 8: Default for this category */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <SwitchToggle
                  checked={serviceForm.isDefault}
                  onChange={v => setServiceForm({ ...serviceForm, isDefault: v })}
                  label="⭐ Default for this category"
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Only one service per category can be default — turning this on unsets any other default in this category. Its price/threshold/timing is what shows on the top delivery bar, PDP badges, and the Delivery tab.
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Works Saturdays/Sundays only matters if this service actually collects on that day — if unsure, leave both off (matches most UK carriers).
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setServiceModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveService}
                disabled={savingService}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {savingService ? "Saving..." : editingService ? "Save Changes" : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── MODAL: Manage Carriers (Adaptive Light & Dark Mode) ── */}
      {carrierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-5 transition-all text-slate-900 dark:text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-cyan-500/10 border border-orange-500/20 dark:border-cyan-500/20 flex items-center justify-center text-orange-600 dark:text-cyan-400">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                    Manage Carriers
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Configure delivery carriers and tracking URL templates
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCarrierModal(false);
                  cancelCarrierForm();
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {carrierView === "list" ? (
              /* ── VIEW 1: Carrier List ── */
              <div className="space-y-4">
                {carriers.length === 0 ? (
                  <div className="text-center py-10 rounded-xl bg-slate-50 dark:bg-[#131b2e] border border-dashed border-slate-200 dark:border-[#1e293b]">
                    <Ship className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                    <p className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      No carriers yet — add Evri, Royal Mail, etc.
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Carriers can be selected when creating delivery services
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {carriers.map(c => (
                      <div
                        key={c.id}
                        className="rounded-xl p-3.5 flex items-center justify-between gap-3 transition-all bg-slate-50 hover:bg-slate-100/90 dark:bg-[#131b2e] dark:hover:bg-[#18223a] border border-slate-200 dark:border-[#1e293b]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.isActive ? "#10b981" : "#94a3b8" }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                              {c.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block mt-0.5 font-normal truncate max-w-[280px] sm:max-w-[340px]">
                              {c.trackingUrl || "No tracking URL template"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCarrier(c)}
                            title="Edit carrier"
                            className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCarrier(c.id, c.name)}
                            title="Delete carrier"
                            className="text-slate-400 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* + Add Carrier Full-width button */}
                <button
                  type="button"
                  onClick={startAddCarrier}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs text-white shadow-md flex items-center justify-center gap-1.5 transition-all bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400"
                >
                  <Plus className="w-4 h-4" /> Add Carrier
                </button>
              </div>
            ) : (
              /* ── VIEW 2: Add / Edit Carrier Form ── */
              <div className="space-y-4">
                {carrierError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl">
                    {carrierError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Carrier Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:focus:ring-violet-500/30 focus:border-amber-500 dark:focus:border-violet-500 transition-all"
                    placeholder="e.g. Evri, Royal Mail"
                    value={carrierForm.name}
                    onChange={e => setCarrierForm({ ...carrierForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tracking URL Template
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:focus:ring-violet-500/30 focus:border-amber-500 dark:focus:border-violet-500 transition-all font-mono"
                    placeholder="https://www.evri.com/track/parcel/{trackingNumber}"
                    value={carrierForm.trackingUrl}
                    onChange={e => setCarrierForm({ ...carrierForm, trackingUrl: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Use{" "}
                    <span className="font-mono text-slate-800 dark:text-cyan-400 font-semibold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                      {"{trackingNumber}"}
                    </span>{" "}
                    where the tracking number should go.
                  </p>
                </div>

                {/* Active Toggle */}
                <div className="pt-1">
                  <SwitchToggle
                    checked={carrierForm.isActive}
                    onChange={v => setCarrierForm({ ...carrierForm, isActive: v })}
                    label="Active"
                  />
                </div>

                {/* Bottom Buttons: Back & Add/Update Carrier */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={cancelCarrierForm}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors text-center"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={saveCarrier}
                    disabled={savingCarrier}
                    className="py-2.5 px-4 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {savingCarrier ? "Saving..." : editingCarrier ? "Update Carrier" : "Add Carrier"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. POSTCODE TAB
// ══════════════════════════════════════════════════════════════════════════════

function PostcodeTab() {
  const toast = useToast();
  const [rules, setRules] = useState<PostcodeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<PostcodeRule | null>(null);
  const [form, setForm] = useState<Omit<PostcodeRule, "id">>(emptyRule);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<PostcodeRule[]>(API_ENDPOINTS.postcodeRules);
      setRules(Array.isArray(data) ? data : []);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyRule });
    setError("");
    setModal(true);
  }

  function openEdit(r: PostcodeRule) {
    setEditing(r);
    setForm({
      postcodePattern: r.postcodePattern,
      ruleType: r.ruleType,
      surchargeAmount: r.surchargeAmount,
      notes: r.notes ?? "",
      isActive: r.isActive
    });
    setError("");
    setModal(true);
  }

  async function save() {
    if (!form.postcodePattern.trim()) {
      setError("Postcode pattern is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        ...form,
        postcodePattern: form.postcodePattern.trim().toUpperCase(),
        notes: form.notes || null
      };

      if (editing) {
        await apiFetch(`${API_ENDPOINTS.postcodeRules}/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ id: editing.id, ...body })
        });
        toast.success("Rule updated!");
      } else {
        await apiFetch(API_ENDPOINTS.postcodeRules, {
          method: "POST",
          body: JSON.stringify(body)
        });
        toast.success("Rule created!");
      }
      setModal(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to save rule.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, pattern: string) {
    if (!confirm(`Delete rule for "${pattern}"?`)) return;
    try {
      await apiFetch(`${API_ENDPOINTS.postcodeRules}/${id}`, { method: "DELETE" });
      toast.success("Rule deleted!");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs">Manage Scottish Highlands, Islands, and surcharge areas</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/10 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Postcode Rule
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-10">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-slate-400 text-sm">No postcode rules yet</p>
            <button onClick={openCreate} className="mt-2 text-cyan-400 hover:text-cyan-300 text-xs">
              + Add Rule
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {rules.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center font-bold text-xs text-white font-mono">
                    {r.postcodePattern.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-bold font-mono">{r.postcodePattern}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        r.ruleType === "Restricted"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {r.ruleType === "Restricted" ? "Restricted" : `+£${r.surchargeAmount.toFixed(2)}`}
                      </span>
                      {!r.isActive && (
                        <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {r.notes && <p className="text-slate-400 text-[11px] mt-0.5">{r.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(r)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(r.id, r.postcodePattern)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Postcode Rule Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-base font-bold text-white">
                {editing ? "Edit Postcode Rule" : "Create Postcode Rule"}
              </h3>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Postcode Pattern *</label>
                <input
                  type="text"
                  className={inpClass}
                  placeholder="e.g. BT, IV, GY, KW"
                  value={form.postcodePattern}
                  onChange={e => setForm({ ...form, postcodePattern: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rule Type</label>
                  <select
                    className={inpClass}
                    value={form.ruleType}
                    onChange={e => setForm({ ...form, ruleType: e.target.value as any })}
                  >
                    <option value="Surcharge">Surcharge</option>
                    <option value="Restricted">Restricted (No delivery)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Surcharge Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={form.ruleType === "Restricted"}
                    className={inpClass}
                    value={form.surchargeAmount}
                    onChange={e => setForm({ ...form, surchargeAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Area / Notes</label>
                <input
                  type="text"
                  className={inpClass}
                  placeholder="e.g. Northern Ireland, Channel Islands"
                  value={form.notes || ""}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="pt-1">
                <SwitchToggle
                  checked={form.isActive}
                  onChange={v => setForm({ ...form, isActive: v })}
                  label="Active"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save Rule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. SETTINGS & HOLIDAYS TAB
// ══════════════════════════════════════════════════════════════════════════════

function SettingsTab() {
  const toast = useToast();
  const [holidays, setHolidays] = useState<NonWorkingDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<NonWorkingDay | null>(null);
  const [form, setForm] = useState<Omit<NonWorkingDay, "id">>(emptyHoliday);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<NonWorkingDay[]>(API_ENDPOINTS.nonWorkingDays);
      setHolidays(Array.isArray(data) ? data : []);
    } catch {
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyHoliday });
    setError("");
    setModal(true);
  }

  function openEdit(h: NonWorkingDay) {
    setEditing(h);
    setForm({
      date: h.date?.split("T")[0] || h.date,
      name: h.name,
      isRecurringYearly: h.isRecurringYearly,
      isActive: h.isActive,
      notes: h.notes ?? ""
    });
    setError("");
    setModal(true);
  }

  async function save() {
    if (!form.name.trim() || !form.date) {
      setError("Name and date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        ...form,
        notes: form.notes || null
      };

      if (editing) {
        await apiFetch(`${API_ENDPOINTS.nonWorkingDays}/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ id: editing.id, ...body })
        });
        toast.success("Holiday updated!");
      } else {
        await apiFetch(API_ENDPOINTS.nonWorkingDays, {
          method: "POST",
          body: JSON.stringify(body)
        });
        toast.success("Holiday created!");
      }
      setModal(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to save holiday.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete holiday "${name}"?`)) return;
    try {
      await apiFetch(`${API_ENDPOINTS.nonWorkingDays}/${id}`, { method: "DELETE" });
      toast.success("Holiday deleted!");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs">Dates when store warehouse is closed (shifts dispatch dates forward)</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/10 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Holiday / Closure
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-10">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-slate-400 text-sm">No holidays configured</p>
            <p className="text-slate-500 text-xs mt-1">Add UK Bank Holidays (e.g. Christmas Day, Boxing Day, Easter)</p>
            <button onClick={openCreate} className="mt-2 text-cyan-400 hover:text-cyan-300 text-xs">
              + Add Holiday
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {holidays.map(h => (
              <div key={h.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-amber-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-bold">{h.name}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                        {h.date?.split("T")[0]}
                      </span>
                      {h.isRecurringYearly && (
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-semibold">
                          Recurring Yearly
                        </span>
                      )}
                    </div>
                    {h.notes && <p className="text-slate-400 text-[11px] mt-0.5">{h.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(h)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(h.id, h.name)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Holiday Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-base font-bold text-white">
                {editing ? "Edit Holiday / Closure" : "Create Holiday / Closure"}
              </h3>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Holiday / Event Name *</label>
                <input
                  type="text"
                  className={inpClass}
                  placeholder="e.g. Christmas Day, Spring Bank Holiday"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date *</label>
                <input
                  type="date"
                  className={inpClass}
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  className={inpClass}
                  placeholder="e.g. Warehouse closed, no carrier pickup"
                  value={form.notes || ""}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <SwitchToggle
                  checked={form.isRecurringYearly}
                  onChange={v => setForm({ ...form, isRecurringYearly: v })}
                  label="Recurring Yearly"
                />
                <SwitchToggle
                  checked={form.isActive}
                  onChange={v => setForm({ ...form, isActive: v })}
                  label="Active"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save Holiday"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
