"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast/CustomToast";
import { getPharmaSessionId } from "@/app/lib/pharmaSession";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
interface PharmaOption {
  optionId: string;
  optionText: string;
}

interface PharmaQuestion {
  questionId: string;
  questionText: string;
  answerType: "Options" | "Text" | "Number";
  isRequired: boolean;
  displayOrder: number;
  options?: PharmaOption[];
}

interface ExistingResponse {
  questionId: string;
  answerText: string | null;
  selectedOptionId: string | null;
}

export default function PharmaQuestionsModal({
  open,
  productId,
  mode = "add",
  onClose,
  onSuccess,
}: {
  open: boolean;
  productId: string;
  mode?: "add" | "edit";
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const toast = useToast();
  const { isAuthenticated } = useAuth();

  const [questions, setQuestions] = useState<PharmaQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const MAX_CHARS = 10;
  // ✅ check required answers before allowing submit
  const isFormValid = questions.every((q) => {
    if (!q.isRequired) return true;

    const val = answers[q.questionId];

    if (q.answerType === "Options") {
      return !!val;
    }

    return (
      val &&
      String(val).trim().length >= MAX_CHARS   // ✅ MIN 10 REQUIRED
    );
  });
  // 🔥 LOAD QUESTIONS + CHECK EXISTING RESPONSES
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // ✅ Safe Headers Creation
        const headers: HeadersInit = {};

        if (isAuthenticated) {
          const token = localStorage.getItem("accessToken");
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
        }

        // 1️⃣ GET QUESTIONS
        const formRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/pharmacy-form`,
          { headers }
        );

        const formJson = await formRes.json();
        const qs: PharmaQuestion[] =
          formJson?.data?.questions || [];

        const sortedQs = qs.sort(
          (a, b) => a.displayOrder - b.displayOrder
        );

        setQuestions(sortedQs);

        // If no questions → allow cart directly
        if (sortedQs.length === 0) {
          onSuccess("No medical questions required.");
          return;
        }

        // 2️⃣ CHECK EXISTING RESPONSES
        // 2️⃣ CHECK EXISTING RESPONSES (ONLY FOR EDIT MODE)

        if (mode === "edit") {

          const sessionId = isAuthenticated
            ? null
            : getPharmaSessionId();

          const query =
            isAuthenticated || !sessionId
              ? ""
              : `?sessionId=${sessionId}`;

          const respRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/pharmacy-responses${query}`,
            { headers }
          );

          const respJson = await respRes.json();
          const existing: ExistingResponse[] =
            respJson?.data || [];

          if (existing.length > 0) {
            const prefilled: Record<string, any> = {};

            existing.forEach((r) => {
              prefilled[r.questionId] =
                r.selectedOptionId ?? r.answerText ?? "";
            });

            setAnswers(prefilled);
            setIsEditMode(true);
          } else {
            setAnswers({});
            setIsEditMode(false);
          }

        } else {

          // 🔥 ADD TO CART MODE → always fresh form
          setAnswers({});
          setIsEditMode(false);

        }
      } catch (err) {
        toast.error("Unable to load medical form");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, productId, mode, isAuthenticated, toast, onClose, onSuccess]);

  // 🔥 SUBMIT / UPDATE
  const handleSubmit = async () => {

    try {
      setSubmitting(true);

      const requestHeaders: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated) {
        const token = localStorage.getItem("accessToken");
        if (token) {
          requestHeaders["Authorization"] = `Bearer ${token}`;
        }
      }

      const sessionId = isAuthenticated
        ? null
        : getPharmaSessionId();

      const payload = {
        sessionId,
        answers: questions
          .map((q) => {
            const val = answers[q.questionId];

            // 🔴 skip empty answers
            if (!val || String(val).trim() === "") {
              return null;
            }

            return {
              questionId: q.questionId,
              selectedOptionId:
                q.answerType === "Options"
                  ? val
                  : null,
              answerText:
                q.answerType !== "Options"
                  ? String(val)
                  : null,
            };
          })
          .filter(Boolean),
      };
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/pharmacy-form`,
        {
          method,
          headers: requestHeaders,
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();

      if (!json?.data?.success) {

        // backend validation errors array
        if (json?.data?.errors && Array.isArray(json.data.errors)) {

          json.data.errors.forEach((err: string) => {
            toast.error(err);
          });

        } else {

          toast.error(
            json?.data?.message ||
            "Validation failed. Please check your answers."
          );

        }

        return;
      }

      toast.success(json?.data?.message);
      onSuccess(json?.data?.message);
    } catch (err) {
      toast.error("Failed to submit medical information");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%-0.5rem)] max-w-3xl max-h-[80vh] rounded-xl p-0 flex flex-col overflow-hidden">

        {/* HEADER */}
        <DialogHeader className="px-3 pt-3 pb-2 border-b bg-gradient-to-r from-[#f38918]/5 to-transparent shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-[#f38918]/10 p-1.5 rounded-lg shrink-0">
              <ShieldCheck className="h-5 w-5 text-[#f38918]" />
            </div>
            <div>
              <DialogTitle className="text-sm md:text-base font-semibold text-gray-900 leading-tight">
                Medical Information Required
              </DialogTitle>
              <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">
                Please answer the following questions to continue safely.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* BODY */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[#f38918]" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
            {questions.map((q, index) => (
              <div
                key={q.questionId}
                className="bg-white border rounded-lg p-3 shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="text-xs md:text-sm font-semibold text-gray-800">
                    {index + 1}. {q.questionText}
                  </label>

                  {q.isRequired && (
                    <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium shrink-0">
                      <AlertCircle className="h-3 w-3" />
                      Required
                    </span>
                  )}
                </div>

                {/* OPTIONS TYPE */}
                {q.answerType === "Options" && (
                  <div className="flex flex-wrap gap-2">
                    {q.options?.map((opt) => {
                      const selected =
                        answers[q.questionId] === opt.optionId;

                      return (
                        <button
                          key={opt.optionId}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q.questionId]: opt.optionId,
                            }))
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5
    ${selected
                              ? "bg-[#f38918] text-white border-[#f38918] shadow"
                              : "bg-white text-gray-700 border-gray-300 hover:border-[#f38918]"
                            }
  `}
                        >
                          {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {opt.optionText}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* TEXT / NUMBER TYPE */}
                {q.answerType !== "Options" && (
                  <div className="space-y-1">
                    <textarea
                      rows={2}
                      value={answers[q.questionId] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;

                        setAnswers((prev) => ({
                          ...prev,
                          [q.questionId]: val,
                        }));
                      }}
                      placeholder="Type your answer here..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs md:text-sm focus:ring-2 focus:ring-[#f38918]/30 focus:border-[#f38918] outline-none resize-none transition-all"
                    />

                    {/* 🔢 CHAR COUNT */}
                    <div
                      className={`text-[10px] text-right ${(answers[q.questionId]?.length || 0) >= 10
                          ? "text-green-600"
                          : "text-red-500"
                        }`}
                    >
                      {(answers[q.questionId]?.length || 0)}/10
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div className="px-3 py-2 border-t bg-white flex flex-col-reverse md:flex-row md:justify-end items-stretch md:items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-lg flex items-center justify-center gap-2 w-full md:w-auto h-8 text-xs"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !isFormValid}
            className="bg-[#f38918] hover:bg-black text-white rounded-lg px-5 flex items-center justify-center gap-2 w-full md:w-auto h-8 text-xs"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}

            {submitting
              ? "Submitting..."
              : !isFormValid
                ? "Answer required questions"
                : isEditMode
                  ? "Update Answers"
                  : "Submit & Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}