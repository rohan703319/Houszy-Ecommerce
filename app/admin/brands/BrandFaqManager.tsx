"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Loader2, Search } from "lucide-react";
import { brandFaqsService, BrandFaq } from "@/lib/services/brandFaqs";
import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "../_components/ConfirmDialog";

interface Props {
  brandId: string;
  faqs?: BrandFaq[];
  onChange?: (faqs: BrandFaq[]) => void; // parent update
}

export default function BrandFaqManager({
  brandId,
  faqs = [],
  onChange,
}: Props) {
  const toast = useToast();

  const [list, setList] = useState<BrandFaq[]>(faqs);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<BrandFaq | null>(null);
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);
const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    question: "",
    answer: "",
    displayOrder: 1,
    isActive: true,
  });

useEffect(() => {
  // ❌ STOP if no brandId
  if (!brandId) return;

  const loadFaqs = async () => {
    try {
      const res = await brandFaqsService.getByBrandId(brandId);

      if (!res?.data?.success || !res.data.data) {
        return; // ❌ no error toast
      }

      setList(res.data.data);

    } catch (err: any) {
      // ❌ 404 ignore karo (expected case)
      if (err?.response?.status === 404) return;

      toast.error("Failed to load FAQs");
    }
  };

  loadFaqs();
}, [brandId]);

const filteredList = list.filter((faq) => {
  const q = faq.question.toLowerCase();
  const a = faq.answer.toLowerCase();
  const s = search.toLowerCase();

  return q.includes(s) || a.includes(s);
});

  // ================= SAVE (CREATE + UPDATE) =================
const handleSave = async () => {
  if (!form.question.trim()) {
    toast.error("Question required");
    return;
  }

  try {
    setLoading(true);

    // ===============================
    // 🔥 CREATE MODE (NO brandId)
    // ===============================
    if (!brandId) {
      const temp = {
        ...form,
        id: crypto.randomUUID(),
      };

      const updated = editingFaq
        ? list.map(f => f.id === editingFaq.id ? temp : f)
        : [...list, temp];

      setList(updated);
      onChange?.(updated);

      toast.success(editingFaq ? "Updated (local) ✅" : "Added (local) ✅");

      setShowModal(false);
      setEditingFaq(null);
      return;
    }

    // ===============================
    // 🔥 EDIT MODE (API CALL)
    // ===============================
    let res;

    if (editingFaq) {
      res = await brandFaqsService.update(
        brandId,
        editingFaq.id,
        form
      );
    } else {
      res = await brandFaqsService.create(brandId, form);
    }

    if (!res?.data?.success || !res.data.data) {
      throw new Error("Invalid response");
    }

    const saved = res.data.data;

    let updated;

    if (editingFaq) {
      updated = list.map(f =>
        f.id === editingFaq.id ? saved : f
      );
    } else {
      updated = [...list, saved];
    }

    setList(updated);
    onChange?.(updated);

    toast.success(editingFaq ? "Updated ✅" : "Created ✅");

    setShowModal(false);
    setEditingFaq(null);

  } catch (err) {
    toast.error("Failed");
  } finally {
    setLoading(false);
  }
};

  // ================= DELETE =================
  const handleDelete = async (faqId: string) => {
    try {
      setLoading(true);

      await brandFaqsService.delete(brandId, faqId);

      const updated = list.filter((f) => f.id !== faqId);

      setList(updated);
      onChange?.(updated);

      toast.success("Deleted ✅");

    } catch {
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // ================= OPEN ADD =================
  const openAdd = () => {
    setEditingFaq(null);
    setForm({
      question: "",
      answer: "",
      displayOrder: list.length + 1,
      isActive: true,
    });
    setShowModal(true);
  };

  // ================= OPEN EDIT =================
const openEdit = (faq: BrandFaq) => {
  const fresh = list.find(f => f.id === faq.id);

  if (!fresh) {
    toast.error("FAQ not found");
    return;
  }

  setEditingFaq(fresh);
  setForm({
    question: fresh.question,
    answer: fresh.answer,
    displayOrder: fresh.displayOrder,
    isActive: fresh.isActive,
  });

  setShowModal(true);
};

  return (
  <div className="space-y-4">

  {/* HEADER */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

  {/* LEFT */}
  <div>
    <h3 className="text-white font-semibold text-base">
      FAQs {list.length > 0 && `(${list.length})`}
    </h3>
  </div>

  {/* RIGHT */}
  <div className="flex gap-2 w-full sm:w-auto">

    {/* 🔍 SEARCH */}
    <div className="relative flex-1 sm:flex-none">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search FAQs..."
        className="w-full sm:w-56 px-3 py-2 pl-8 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
      />
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
    </div>

    {/* ➕ ADD */}
    <button
      type="button"
      onClick={openAdd}
      className="px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      Add
    </button>

  </div>
</div>

  {/* LIST */}
{filteredList.length > 0 ? (
  <div className="space-y-3">
    {filteredList.map((faq, idx) => (
      <div
        key={faq.id}
        className="group p-4 bg-slate-800/60 border border-slate-700 rounded-xl hover:border-violet-500/40 transition-all"
      >
        <div className="flex justify-between items-start gap-4">

          <div className="flex-1">
            <p className="text-white font-medium text-sm">
              {idx + 1}. {faq.question}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {faq.answer}
            </p>
          </div>

          <div className="flex gap-2 opacity-70 group-hover:opacity-100">
            <button onClick={() => openEdit(faq)} type="button">
              <Edit className="h-4 w-4 text-blue-400" />
            </button>

            <button onClick={() => setDeleteFaqId(faq.id)} type="button">
              <Trash2 className="h-4 w-4 text-red-400" />
            </button>
          </div>

        </div>
      </div>
    ))}
  </div>
) : (
  <div className="text-center py-10 text-slate-400 text-sm">
    {search ? "No matching FAQs found" : "No FAQs added yet"}
  </div>
)}

  {/* MODAL */}
  {showModal && (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">

      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="px-5 py-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-white font-semibold text-lg">
            {editingFaq ? "Edit FAQ" : "Add FAQ"}
          </h2>

          <button
            onClick={() => setShowModal(false)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">

          {/* QUESTION */}
          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Question
            </label>
            <input
              value={form.question}
              onChange={(e) =>
                setForm({ ...form, question: e.target.value })
              }
              placeholder="Enter question"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          {/* ANSWER */}
          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Answer
            </label>
            <textarea
              value={form.answer}
              onChange={(e) =>
                setForm({ ...form, answer: e.target.value })
              }
              placeholder="Enter answer"
              rows={4}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none"
            />
          </div>

          {/* ORDER + ACTIVE */}
          <div className="flex gap-4 items-center">

            <div className="flex-1">
              <label className="text-sm text-slate-300 mb-1 block">
                Display Order
              </label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm({
                    ...form,
                    displayOrder: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
              />
            </div>

            <div className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={() =>
                  setForm({ ...form, isActive: !form.isActive })
                }
                className="accent-violet-500"
              />
              <span className="text-sm text-white">Active</span>
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <div className="px-5 py-4 border-t border-slate-700 flex gap-3">

          <button
            onClick={() => setShowModal(false)}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg"
          >
            Cancel
          </button>

          <button
          type="button"
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2 rounded-lg flex justify-center items-center"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingFaq ? (
              "Update FAQ"
            ) : (
              "Save FAQ"
            )}
          </button>

        </div>

      </div>
    </div>
  )}

  {/* DELETE CONFIRM */}
  <ConfirmDialog
    isOpen={!!deleteFaqId}
    onClose={() => setDeleteFaqId(null)}
    onConfirm={() => {
      if (deleteFaqId) {
        handleDelete(deleteFaqId);
        setDeleteFaqId(null);
      }
    }}
    title="Delete FAQ"
    message="This action cannot be undone"
    confirmText="Delete"
    cancelText="Cancel"
    icon={Trash2}
    iconColor="text-red-400"
    confirmButtonStyle="bg-gradient-to-r from-red-500 to-rose-500"
    isLoading={loading}
  />
</div>
  );
}