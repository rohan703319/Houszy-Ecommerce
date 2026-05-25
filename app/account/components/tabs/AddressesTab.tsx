"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from "@/app/lib/api/address";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/toast/CustomToast";
import { MapPin, Phone, Trash2, Edit2, Plus, Home } from "lucide-react";

interface Address {
  id: string; firstName: string; lastName: string;
  addressLine1: string; addressLine2: string; city: string;
  state: string; postalCode: string; country: string;
  phoneNumber: string; isDefault: boolean;
}

export default function AddressesTab() {
  const { accessToken, user } = useAuth();
  const toast = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const ukPhoneRegex = /^\d{10}$/;
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm: Omit<Address, "id"> = {
    firstName: "", lastName: "", addressLine1: "", addressLine2: "",
    city: "", state: "", postalCode: "", country: "", phoneNumber: "", isDefault: false,
  };
  const [form, setForm] = useState<Omit<Address, "id">>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, wait = 350) {
    const timer = useRef<number | undefined>(undefined);
    const latestFn = useRef(fn);
    useEffect(() => { latestFn.current = fn; }, [fn]);
    return useCallback((...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = window.setTimeout(() => { latestFn.current(...args); }, wait) as unknown as number;
    }, [wait]);
  }

  useEffect(() => {
    if (!accessToken) return;
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const data = await getAddresses(accessToken);
        setAddresses([...data].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)));
      } catch (err: any) {
        console.error(err);
      } finally { setLoading(false); }
    };
    fetchAddresses();
  }, [accessToken]);

  const doAutocomplete = useCallback(async (q: string) => {
    if (!q || q.trim().length < 3) { setAddressSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/address-lookup/search?query=${encodeURIComponent(q.trim())}&country=GB`);
      const json = await res.json();
      if (!json?.success || !Array.isArray(json.data)) { setAddressSuggestions([]); setShowSuggestions(false); return; }
      setAddressSuggestions(json.data); setShowSuggestions(json.data.length > 0);
    } catch { setAddressSuggestions([]); setShowSuggestions(false); }
  }, []);

  const debouncedAutocomplete = useDebouncedCallback(doAutocomplete, 350);
  useEffect(() => { debouncedAutocomplete(addressQuery); }, [addressQuery, debouncedAutocomplete]);

  const fetchAddressDetails = async (id: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/address-lookup/details/${encodeURIComponent(id)}`);
    const json = await res.json();
    if (!json?.success || !json?.data) throw new Error("Failed to fetch address details");
    return json.data;
  };

  const handleSelectSuggestion = async (s: any) => {
    try {
      setShowSuggestions(false); setAddressSuggestions([]); setAddressQuery("");
      const details = await fetchAddressDetails(s.id);
      const line1 = details.line1 || details.line2 || details.line3 || s.text || "";
      const city = details.city || details.town || details.locality || "";
      const state = details.province || "";
      const postcode = details.postalCode || "";
      const country = details.country || "United Kingdom";
      setForm((prev) => ({ ...prev, addressLine1: line1, city, state, postalCode: postcode, country }));
    } catch (err) { console.error(err); }
  };

  const validateField = (key: keyof typeof form, value: string) => {
    let errorMsg = "";
    const requiredFields = ["firstName", "addressLine1", "city", "postalCode", "country", "phoneNumber"];
    if (requiredFields.includes(key) && !value.trim()) errorMsg = "Required";
    if (key === "phoneNumber") {
      const cleaned = value.replace(/\D/g, "");
      if (!cleaned) errorMsg = "Required"; else if (!ukPhoneRegex.test(cleaned)) errorMsg = "Must be 10 digits";
    }
    setFormErrors((prev) => ({ ...prev, [key]: errorMsg }));
    return errorMsg === "";
  };

  const handleChange = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value ?? "" }));
    if (key !== "isDefault") validateField(key, value ?? "");
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setForm({ ...emptyForm, firstName: user?.firstName || "", lastName: user?.lastName || "" });
    setFormErrors({}); setOpen(true);
  };

  const handleSave = async () => {
    if (!accessToken) return;
    let isValid = true;
    Object.entries(form).forEach(([key, value]) => {
      if (key === "addressLine2" || key === "state" || key === "isDefault") return;
      if (!validateField(key as keyof typeof form, String(value ?? ""))) isValid = false;
    });
    if (!isValid) return;

    const payload = { ...form, phoneNumber: "+44" + form.phoneNumber };

    try {
      if (editingAddress) {
        const updated = await updateAddress(accessToken, editingAddress.id, payload);
        setAddresses((prev) => {
          let list = prev.map((a) => (a.id === updated.id ? updated : a));
          if (updated.isDefault) list = list.map((a) => a.id === updated.id ? { ...a, isDefault: true } : { ...a, isDefault: false });
          return list.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
        });
        toast.success("Address updated");
      } else {
        const created = await createAddress(accessToken, payload);
        setAddresses((prev) => {
          let updated = prev;
          if (created.isDefault) updated = prev.map((a) => ({ ...a, isDefault: false }));
          const list = [created, ...updated];
          return list.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
        });
        toast.success("Address added");
      }
      setOpen(false);
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteClick = (id: string) => { setDeleteId(id); setDeleteOpen(true); };

  const confirmDelete = async () => {
    if (!accessToken || !deleteId) return;
    try {
      await deleteAddress(accessToken, deleteId);
      setAddresses((prev) => {
        const list = prev.filter((a) => a.id !== deleteId);
        if (!list.some((a) => a.isDefault) && list.length > 0) list[0].isDefault = true;
        return list.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      });
      setDeleteOpen(false); setDeleteId(null);
    } catch (err: any) { alert(err.message); }
  };

  const handleSetDefault = async (id: string) => {
    if (!accessToken) return;
    try {
      await setDefaultAddress(accessToken, id);
      setAddresses((prev) => {
        const list = prev.map((a) => ({ ...a, isDefault: a.id === id }));
        return list.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      });
      toast.success("Default address updated");
    } catch (err: any) { alert(err.message); }
  };

  if (!accessToken) return null;
  if (loading) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Saved Addresses</h1>
          <p className="text-sm font-medium text-gray-500 mt-2">Manage your delivery locations</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Address
        </button>
      </div>

      {!addresses.length && (
        <div className="bg-gray-50/50 rounded border border-gray-100 p-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded shadow-sm flex items-center justify-center mb-4">
            <Home className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No saved addresses</h3>
          <p className="text-sm font-medium text-gray-500">Add an address to speed up checkout.</p>
        </div>
      )}

      {/* ADDRESS GRID */}
      <div className="grid md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div key={addr.id} className={`rounded p-4 transition-all border ${addr.isDefault ? 'border-[#f38918] bg-orange-50/20 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'} flex flex-col justify-between`}>

            <div>
              <div className="flex justify-between items-start mb-3">
                <p className="font-bold text-gray-900 text-lg">{addr.firstName} {addr.lastName}</p>
                {addr.isDefault && (
                  <span className="text-[10px] font-black tracking-widest uppercase bg-[#f38918] text-white px-2.5 py-1 rounded">
                    Default
                  </span>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium text-gray-600 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    {addr.addressLine1}
                    {addr.addressLine2 && <><br />{addr.addressLine2}</>}
                    <br />{addr.city}, {addr.state} {addr.postalCode}
                    <br />{addr.country}
                  </span>
                </p>
                <p className="text-sm font-medium text-gray-600 flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  {addr.phoneNumber}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-6 mt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setEditingAddress(addr);
                  setForm({ ...addr, phoneNumber: addr.phoneNumber?.replace(/^\+44/, "") ?? "" });
                  setFormErrors({}); setOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold uppercase tracking-wide text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>

              <button
                onClick={() => handleDeleteClick(addr.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold uppercase tracking-wide text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>

              {!addr.isDefault && (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wide text-black border-2 border-gray-100 hover:bg-gray-50 transition-colors ml-auto"
                >
                  Make Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded p-0 border-none shadow-2xl">
          <DialogHeader className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <DialogTitle className="text-xl font-black text-gray-900 tracking-tight">
              {editingAddress ? "Edit Address" : "Add Address"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="relative">
              <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">Search address or postcode</label>
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                placeholder="Start typing postcode or address"
                className="w-full h-11 border border-gray-200 bg-white rounded px-4 focus:outline-none focus:ring-2 focus:ring-[#f38918] transition-all font-medium text-sm"
              />
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 bg-white border border-gray-100 rounded mt-1 w-full max-h-60 overflow-auto shadow-xl">
                  {addressSuggestions.map((s) => (
                    <button key={s.id} type="button" onClick={() => handleSelectSuggestion(s)} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                      {s.text}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {["firstName", "lastName", "addressLine1", "addressLine2", "city", "state", "postalCode", "country", "phoneNumber"].map((field) => {
                const isRequired = ["firstName", "addressLine1", "city", "postalCode", "country", "phoneNumber"].includes(field);
                return (
                  <div key={field} className={["addressLine1", "addressLine2", "phoneNumber"].includes(field) ? "col-span-2" : ""}>
                    <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {field === "state" ? "County (optional)" : field.replace(/([A-Z])/g, ' $1').trim()} {isRequired && <span className="text-red-500">*</span>}
                    </label>
                    {field === "phoneNumber" ? (
                      <div>
                        <div className="flex rounded overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-[#f38918] transition-all bg-white">
                          <div className="flex items-center px-4 bg-gray-50 border-r border-gray-200 text-gray-600 text-xs font-bold">+44</div>
                          <input
                            value={form.phoneNumber} maxLength={10}
                            onChange={(e) => handleChange("phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                            className="w-full h-11 border-0 bg-transparent px-3 font-medium focus:ring-0 text-sm"
                          />
                        </div>
                        {formErrors.phoneNumber && <p className="text-red-500 text-[11px] font-bold mt-1.5">{formErrors.phoneNumber}</p>}
                      </div>
                    ) : (
                      <>
                        <input
                          value={String(form[field as keyof typeof form] ?? "")}
                          onChange={(e) => handleChange(field as keyof typeof form, e.target.value)}
                          className={`w-full h-11 border bg-white rounded px-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#f38918] transition-all ${formErrors[field as keyof typeof form] ? "border-red-500" : "border-gray-200"}`}
                        />
                        {formErrors[field as keyof typeof form] && <p className="text-red-500 text-[11px] font-bold mt-1.5">{formErrors[field as keyof typeof form]}</p>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 mt-4 bg-gray-50 p-4 rounded border border-gray-100">
              <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={(e) => handleChange("isDefault", e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#f38918] focus:ring-[#f38918]" />
              <label htmlFor="isDefault" className="text-sm font-bold text-gray-900 cursor-pointer">Set as default address</label>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
              <button onClick={() => setOpen(false)} className="px-5 py-3 rounded font-bold text-xs uppercase tracking-wide text-gray-600 bg-white border-2 border-gray-100 hover:bg-gray-50 transition-colors w-full sm:w-auto">Cancel</button>
              <button onClick={handleSave} className="px-5 py-3 rounded font-bold text-xs uppercase tracking-wide text-white bg-black hover:bg-gray-900 transition-colors shadow-sm w-full sm:w-auto">{editingAddress ? "Update" : "Save"}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm rounded p-0 border-none shadow-2xl">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Delete Address</h3>
            <p className="text-sm font-medium text-gray-500 mb-8">Are you sure you want to delete this address? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteOpen(false)} className="flex-1 py-3 font-bold text-xs uppercase tracking-wide text-gray-600 border-2 border-gray-100 rounded hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 font-bold text-xs uppercase tracking-wide text-white bg-red-600 rounded hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
