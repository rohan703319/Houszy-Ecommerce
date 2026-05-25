"use client";

import { useEffect, useState, useRef } from "react";
import { getAddresses } from "@/app/lib/api/address";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  isDefault: boolean;
}

interface Props {
  onSelect: (address: Address | null) => void;
}

export default function SavedAddressesSection({ onSelect }: Props) {
  const { accessToken, isAuthenticated } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const fetchAddresses = async () => {
      try {
        const data: Address[] = await getAddresses(accessToken);
        setAddresses(data);

        if (!hasInitialized.current) {
          const defaultAddress = data.find((a: Address) => a.isDefault);
          if (defaultAddress) {
            setSelectedId(defaultAddress.id);
            onSelect(defaultAddress);
          }
          hasInitialized.current = true;
        }
      } catch {
        console.error("Failed to load addresses");
      }
    };

    fetchAddresses();
  }, [accessToken, isAuthenticated]);

  if (!isAuthenticated || addresses.length === 0) return null;

  const visibleAddresses = addresses.slice(0, 2);

  const AddressCard = (addr: Address) => (
    <label
      key={addr.id}
      className={`relative border rounded p-2 cursor-pointer transition-all duration-200 hover:shadow-md ${selectedId === addr.id
        ? "border-[#f38918] bg-[#f38918]/5 ring-2 ring-[#f38918]/20"
        : "border-gray-200"
        }`}
    >
      {/* 🔥 Default badge top-right */}
      {addr.isDefault && (
        <span className="absolute top-2 right-3 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
          Default
        </span>
      )}

      <div className="flex items-start gap-3">
        <input
          type="radio"
          checked={selectedId === addr.id}
          onChange={() => {
            setSelectedId(addr.id);
            onSelect(addr);
            setOpenModal(false);
          }}
          className="mt-1 accent-[#f38918]"
        />

        <div className="text-sm">
          <div className="font-semibold mb-1">
            {addr.firstName} {addr.lastName}
          </div>

          <div className="text-gray-700 text-xs leading-relaxed line-clamp-2">
            {[
              addr.addressLine1,
              addr.addressLine2,
              addr.city,
              addr.state,
              addr.postalCode,
              addr.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
        </div>

      </div>
    </label>
  );

  return (
    <div className="bg-white p-3 rounded shadow space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">Saved Addresses</h2>

        {/* 🔥 View All button if more than 2 */}
        {addresses.length > 2 && (
          <button
            onClick={() => setOpenModal(true)}
            className="text-xs text-[#f38918] bg-orange-50 border border-orange-200 px-2 py-1 font-medium rounded"
          >
            View all Addresses
          </button>
        )}
      </div>

      {/* Show only 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {visibleAddresses.map((addr) => AddressCard(addr))}
      </div>

      {/* Add new address */}
      <button
        onClick={() => {
          setSelectedId(null);
          onSelect(null);
        }}
        className="text-xs text-[#f38918] font-medium underline"
      >
        + Add new address
      </button>

      {/* 🔥 VIEW ALL MODAL */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto rounded p-4">
          <DialogHeader>
            <DialogTitle className="text-sm">Select Address</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {addresses.map((addr) => AddressCard(addr))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
