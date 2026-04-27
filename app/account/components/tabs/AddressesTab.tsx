"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/app/lib/api/address";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/toast/CustomToast";
interface Address {
  id: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  isDefault: boolean;
}

export default function AddressesTab() {
 const { accessToken, user } = useAuth();
const toast = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

const ukPhoneRegex = /^\d{10}$/;


  const [editingAddress, setEditingAddress] =
    useState<Address | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm: Omit<Address, "id"> = {
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phoneNumber: "",
    isDefault: false,
  };

  const [form, setForm] =
    useState<Omit<Address, "id">>(emptyForm);


  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof typeof form, string>>
  >({});
// 🔎 Address lookup states
const [addressQuery, setAddressQuery] = useState("");
const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);

// Simple debounce (same as checkout)
function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  wait = 350
) {
  const timer = useRef<number | undefined>(undefined);
  const latestFn = useRef(fn);

  useEffect(() => {
    latestFn.current = fn;
  }, [fn]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        latestFn.current(...args);
      }, wait) as unknown as number;
    },
    [wait]
  );
}

  // ---------------- FETCH ----------------
useEffect(() => {
  if (!accessToken) return;

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await getAddresses(accessToken);

     setAddresses(
  [...data].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault)
  )
);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchAddresses();
}, [accessToken]);
// 🔎 Autocomplete search
const doAutocomplete = useCallback(async (q: string) => {
  if (!q || q.trim().length < 3) {
    setAddressSuggestions([]);
    setShowSuggestions(false);
    return;
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/address-lookup/search?query=${encodeURIComponent(
        q.trim()
      )}&country=GB`
    );

    const json = await res.json();

    if (!json?.success || !Array.isArray(json.data)) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setAddressSuggestions(json.data);
    setShowSuggestions(json.data.length > 0);
  } catch {
    setAddressSuggestions([]);
    setShowSuggestions(false);
  }
}, []);

const debouncedAutocomplete = useDebouncedCallback(doAutocomplete, 350);

useEffect(() => {
  debouncedAutocomplete(addressQuery);
}, [addressQuery, debouncedAutocomplete]);

// 🔎 Fetch full details
const fetchAddressDetails = async (id: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/address-lookup/details/${encodeURIComponent(
      id
    )}`
  );

  const json = await res.json();

  if (!json?.success || !json?.data) {
    throw new Error("Failed to fetch address details");
  }

  return json.data;
};

// 🔎 When suggestion selected
const handleSelectSuggestion = async (s: any) => {
  try {
    setShowSuggestions(false);
    setAddressSuggestions([]);
    setAddressQuery("");

    const details = await fetchAddressDetails(s.id);

    const line1 =
      details.line1 ||
      details.line2 ||
      details.line3 ||
      s.text ||
      "";

    const city =
      details.city ||
      details.town ||
      details.locality ||
      "";

    const state = details.province || "";
    const postcode = details.postalCode || "";
    const country = details.country || "United Kingdom";

    setForm((prev) => ({
      ...prev,
      addressLine1: line1,
      city,
      state,
      postalCode: postcode,
      country,
    }));
  } catch (err) {
    console.error("Address details error", err);
  }
};

  // ---------------- VALIDATION ----------------
  const validateField = (
    key: keyof typeof form,
    value: string
  ) => {
    let errorMsg = "";

    const requiredFields = [
      "firstName",
      "addressLine1",
      "city",     
      "postalCode",
      "country",
      "phoneNumber",
    ];

    if (requiredFields.includes(key)) {
      if (!value.trim()) {
        errorMsg = "This field is required";
      }
    }

 if (key === "phoneNumber") {
  const cleaned = value.replace(/\D/g, "");

  if (!cleaned) {
    errorMsg = "Phone number is required";
  } else if (!ukPhoneRegex.test(cleaned)) {
    errorMsg = "Phone number must be 10 digits";
  }
}


    setFormErrors((prev) => ({
      ...prev,
      [key]: errorMsg,
    }));

    return errorMsg === "";
  };

  const handleChange = (
    key: keyof typeof form,
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value ?? "",
    }));

    if (key !== "isDefault") {
      validateField(key, value ?? "");
    }
  };

  // ---------------- ADD ----------------
const handleAddNew = () => {
  setEditingAddress(null);

  setForm({
    ...emptyForm,
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });

  setFormErrors({});
  setOpen(true);
};


  // ---------------- SAVE ----------------
const handleSave = async () => {
  if (!accessToken) return;

  let isValid = true;

  Object.entries(form).forEach(([key, value]) => {
    if (
      key === "addressLine2" ||
      key === "state" ||
      key === "isDefault"
    )
      return;

    const valid = validateField(
      key as keyof typeof form,
      String(value ?? "")
    );

    if (!valid) isValid = false;
  });

  if (!isValid) return;

  const payload = {
    ...form,
    phoneNumber: "+44" + form.phoneNumber,
  };

  try {
    if (editingAddress) {
      const updated = await updateAddress(
        accessToken,
        editingAddress.id,
        payload
      );

   setAddresses((prev) => {
  let list = prev.map((a) =>
    a.id === updated.id ? updated : a
  );

  if (updated.isDefault) {
    list = list.map((a) =>
      a.id === updated.id
        ? { ...a, isDefault: true }
        : { ...a, isDefault: false }
    );
  }

  return list.sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault)
  );
});
  // ✅ TOAST
  toast.success("Address updated successfully");
    } else {
      const created = await createAddress(
        accessToken,
        payload
      );

setAddresses((prev) => {
  let updated = prev;

  if (created.isDefault) {
    updated = prev.map((a) => ({
      ...a,
      isDefault: false,
    }));
  }

  const list = [created, ...updated];

  return list.sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault)
  );
});
  // ✅ TOAST
  toast.success("Address added successfully");
    }

    setOpen(false);
  } catch (err: any) {
    alert(err.message);
  }
};


  // ---------------- DELETE ----------------
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!accessToken || !deleteId) return;

    try {
      await deleteAddress(accessToken, deleteId);
     setAddresses((prev) => {
  const list = prev.filter((a) => a.id !== deleteId);

  if (!list.some((a) => a.isDefault) && list.length > 0) {
    list[0].isDefault = true;
  }

  return list.sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault)
  );
});
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ---------------- SET DEFAULT ----------------
  const handleSetDefault = async (id: string) => {
    if (!accessToken) return;

    try {
      await setDefaultAddress(accessToken, id);

    setAddresses((prev) => {
  const list = prev.map((a) => ({
    ...a,
    isDefault: a.id === id,
  }));

  return list.sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault)
  );
});
    // ✅ TOAST
    toast.success("Default address updated");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!accessToken)
    return <div>Please login to manage addresses.</div>;
  if (loading) return <div>Loading addresses...</div>;
  if (error)
    return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Saved Addresses
        </h2>
        <Button onClick={handleAddNew}>
          Add Address
        </Button>
      </div>

      {!addresses.length && (
        <div className="bg-white rounded-xl border p-6 text-gray-500">
          No saved addresses.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="bg-white rounded-xl border shadow-sm p-5 space-y-2"
          >
            <div className="flex justify-between">
              <p className="font-semibold text-sm">
                {addr.firstName} {addr.lastName}
              </p>

              {addr.isDefault && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {addr.addressLine1}
            </p>
            {addr.addressLine2 && (
              <p className="text-sm text-gray-600">
                {addr.addressLine2}
              </p>
            )}
            <p className="text-sm text-gray-600">
              {addr.city}, {addr.state}{" "}
              {addr.postalCode}
            </p>
            <p className="text-sm text-gray-600">
              {addr.country}
            </p>
<p className="text-sm text-gray-600">
  📞 {addr.phoneNumber}
</p>
            <div className="flex gap-4 pt-2 text-xs">
              <button
                onClick={() => {
                  setEditingAddress(addr);
                  setForm({
                    ...addr,
                    phoneNumber:
                     addr.phoneNumber?.replace(/^\+44/, "") ?? "",
                  });
                  setFormErrors({});
                  setOpen(true);
                }}
                className="text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() =>
                  handleDeleteClick(addr.id)
                }
                className="text-red-600 hover:underline"
              >
                Delete
              </button>

              {!addr.isDefault && (
                <button
                  onClick={() =>
                    handleSetDefault(addr.id)
                  }
                  className="text-green-600 hover:underline"
                >
                  Set Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* ADD / EDIT MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress
                ? "Edit Address"
                : "Add Address"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* 🔎 ADDRESS SEARCH – second row full width */}
<div className="col-span-2 relative">
  <label className="block mb-1 font-medium">
    Search address or postcode
  </label>

  <input
    type="text"
    value={addressQuery}
    onChange={(e) => setAddressQuery(e.target.value)}
    placeholder="Start typing postcode or address"
    className="w-full border rounded px-3 py-2"
  />

  {showSuggestions && addressSuggestions.length > 0 && (
    <div className="absolute z-50 bg-white border rounded mt-1 w-full max-h-60 overflow-auto shadow">
      {addressSuggestions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => handleSelectSuggestion(s)}
          className="w-full text-left px-3 py-2 hover:bg-gray-100"
        >
          {s.text}
        </button>
      ))}
    </div>
  )}
</div>

            {[
              "firstName",
              "lastName",
              "addressLine1",
              "addressLine2",
              "city",
              "state",
              "postalCode",
              "country",
              "phoneNumber",
            ].map((field) => {
              const isRequired = [
                "firstName",
                "addressLine1",
                "city",              
                "postalCode",
                "country",
                "phoneNumber",
              ].includes(field);

              return (
                <div
                  key={field}
                  className={
                    field === "addressLine1" ||
                    field === "addressLine2" ||
                    field === "phoneNumber"
                      ? "col-span-2"
                      : ""
                  }
                >
                 <label className="block mb-1 font-medium capitalize">
  {field === "state" ? "County (optional)" : field}
  {isRequired && " *"}
</label>
               {field === "phoneNumber" ? (
  <div className="col-span-2">
    <div className="flex">
      {/* Fixed +44 */}
      <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-lg text-gray-700 text-sm font-medium">
        +44
      </div>

      <input
        value={form.phoneNumber}
        maxLength={10}
        onChange={(e) => {
          const cleaned = e.target.value
            .replace(/\D/g, "")
            .slice(0, 10);

          handleChange("phoneNumber", cleaned);
        }}
        className={`w-full border rounded-r-lg px-3 py-2 ${
          formErrors.phoneNumber ? "border-red-500" : ""
        }`}
        
      />
    </div>

    {formErrors.phoneNumber && (
      <p className="text-red-600 text-xs mt-1">
        {formErrors.phoneNumber}
      </p>
    )}
  </div>
) : (
  <>
    <input
      value={String(form[field as keyof typeof form] ?? "")}
      onChange={(e) =>
        handleChange(field as keyof typeof form, e.target.value)
      }
      className={`w-full border rounded px-3 py-2 ${
        formErrors[field as keyof typeof form]
          ? "border-red-500"
          : ""
      }`}
    />

    {formErrors[field as keyof typeof form] && (
      <p className="text-red-600 text-xs mt-1">
        {formErrors[field as keyof typeof form]}
      </p>
    )}
  </>
)}


               
                </div>
              );
            })}

            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  handleChange(
                    "isDefault",
                    e.target.checked
                  )
                }
              />
              <label className="text-sm">
                Set as default address
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingAddress
                ? "Update Address"
                : "Create Address"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Delete Address
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-600">
            Are you sure you want to delete
            this address?
          </p>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setDeleteOpen(false)
              }
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
