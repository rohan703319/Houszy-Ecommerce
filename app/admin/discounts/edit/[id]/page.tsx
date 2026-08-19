"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DiscountForm from "../../DiscountForm";
import { Discount, discountsService } from "@/lib/services/discounts";
import { useToast } from "@/app/admin/_components/CustomToast";

export default function EditDiscountPage() {
  const params = useParams();
  const id = params?.id as string;
  const toast = useToast();
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      discountsService.getById(id)
        .then(res => {
          const data = (res?.data?.data || res?.data || res) as any;
          if (data) {
            setDiscount(data);
          } else {
            toast.error("Failed to load discount details");
          }
        })
        .catch(err => {
          console.error(err);
          toast.error("Error loading discount details");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-2">
        <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500">Loading discount details...</p>
      </div>
    );
  }

  if (!discount) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg">Discount not found</p>
      </div>
    );
  }

  return <DiscountForm initialData={discount} isEdit />;
}
