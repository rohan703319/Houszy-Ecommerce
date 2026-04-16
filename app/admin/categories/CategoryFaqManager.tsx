"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Loader2, Search } from "lucide-react";
import { categoryFaqsService, CategoryFaq } from "@/lib/services/categoryFaqs";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import { useToast } from "@/app/admin/_components/CustomToast";

interface Props {
  categoryId: string;
  faqs?: CategoryFaq[];
  onChange?: (faqs: CategoryFaq[]) => void;
}

export default function CategoryFaqManager({
  categoryId,
  faqs = [],
  onChange,
}: Props) {
  const toast = useToast();

  const [list, setList] = useState<CategoryFaq[]>(faqs);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<CategoryFaq | null>(null);
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    question: "",
    answer: "",
    displayOrder: 1,
    isActive: true,
  });

  // ================= LOAD =================
  useEffect(() => {
    if (!categoryId) return;

    const load = async () => {
      try {
        const res = await categoryFaqsService.getByCategoryId(categoryId);
        if (!res?.data?.success || !res.data.data) return;
        setList(res.data.data);
      } catch {}
    };

    load();
  }, [categoryId]);

  useEffect(() => {
  setList(faqs || []);
}, [faqs]);

  // ================= SEARCH =================
  const filteredList = list.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer?.toLowerCase().includes(search.toLowerCase())
  );

  // ================= OPEN =================
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

 const openEdit = (faq: CategoryFaq) => {
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

;

  // ================= SAVE =================
const handleSave = async () => {
  if (!form.question.trim()) {
    toast.error("Question required");
    return;
  }

  try {
    setLoading(true);

    // ===============================
    // 🔥 LOCAL MODE (NO categoryId)
    // ===============================
    if (!categoryId) {
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
    // 🔥 API MODE
    // ===============================
    let res;

    if (editingFaq) {
      res = await categoryFaqsService.update(
        categoryId,
        editingFaq.id,
        form
      );
    } else {
      res = await categoryFaqsService.create(categoryId, form);
    }

    if (!res?.data?.success || !res.data.data) {
      throw new Error();
    }

    const saved = res.data.data;

    const updated = editingFaq
      ? list.map(f => f.id === editingFaq.id ? saved : f)
      : [...list, saved];

    setList(updated);
    onChange?.(updated);

    toast.success(editingFaq ? "Updated ✅" : "Created ✅");

    setShowModal(false);
    setEditingFaq(null);

  } catch {
    toast.error("Failed");
  } finally {
    setLoading(false);
  }
};


  // ================= DELETE =================
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);

    if (!categoryId) {
  // ✅ LOCAL DELETE
  const updated = list.filter((f) => f.id !== id);
  setList(updated);
  onChange?.(updated);
  toast.success("Deleted (local) ✅");
  return;
}

// ✅ API DELETE
await categoryFaqsService.delete(categoryId, id);

      const updated = list.filter((f) => f.id !== id);

      setList(updated);
      onChange?.(updated);

      toast.success("Deleted ✅");
    } catch {
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <h3 className="text-white font-semibold text-base">
          FAQs {list.length > 0 && `(${list.length})`}
        </h3>

        <div className="flex gap-2 w-full sm:w-auto">

          {/* SEARCH */}
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

          {/* ADD */}
          <button
            onClick={openAdd}
            type="button"
            className="px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm flex items-center gap-2 hover:opacity-90"
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

              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* BODY */}
           <div className="p-5 space-y-5">

  {/* QUESTION */}
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-1">
      Question <span className="text-red-400">*</span>
    </label>

    <input
      value={form.question}
      onChange={(e) =>
        setForm({ ...form, question: e.target.value })
      }
      placeholder="Enter FAQ question"
      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
    />
  </div>

  {/* ANSWER */}
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-1">
      Answer <span className="text-red-400">*</span>
    </label>

    <textarea
      value={form.answer}
      onChange={(e) =>
        setForm({ ...form, answer: e.target.value })
      }
      placeholder="Enter detailed answer"
      rows={4}
      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-all"
    />
  </div>

  {/* SETTINGS ROW */}
  <div className="grid grid-cols-2 gap-4">

    {/* DISPLAY ORDER */}
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        Display Order
      </label>

      <input
        type="number"
        min="1"
        value={form.displayOrder}
        onChange={(e) =>
          setForm({
            ...form,
            displayOrder: Number(e.target.value),
          })
        }
        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
      />
    </div>

    {/* ACTIVE */}
    <div className="flex items-end">
      <label className="flex items-center justify-center gap-2 text-sm text-white bg-slate-800 border border-slate-600 px-3 py-2.5 rounded-lg w-full cursor-pointer hover:border-violet-500 transition-all">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={() =>
            setForm({ ...form, isActive: !form.isActive })
          }
          className="w-4 h-4 text-violet-500"
        />
        Active FAQ
      </label>
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
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2 rounded-lg flex justify-center items-center"
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

      {/* DELETE */}
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