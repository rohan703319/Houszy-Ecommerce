"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

/* ================= TYPES ================= */
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: ReactNode;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  success: (msg: ReactNode, duration?: number) => void;
  error: (msg: ReactNode, duration?: number) => void;
  info: (msg: ReactNode, duration?: number) => void;
  warning: (msg: ReactNode, duration?: number) => void;
    clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

/* ================= STYLES ================= */
const toastStyles: Record<ToastType, string> = {
  success:
    "bg-green-700 text-white",
  error:
    "bg-gradient-to-r from-red-600 to-red-700 text-white",
info:
  "bg-violet-500 text-white border border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.5)] relative overflow-hidden",
  warning:
    "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black",
};

const toastIcons: Record<ToastType, any> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

/* ================= TOAST ITEM ================= */
const ToastItem = ({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) => {
  const Icon = toastIcons[toast.type];

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(toast.duration);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    startTimeRef.current = Date.now();
    clearTimer();

    timerRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, remainingRef.current);
  };

  useEffect(() => {
    startTimer();
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseEnter = () => {
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(
      remainingRef.current - elapsed,
      0
    );
    clearTimer();
  };

  const handleMouseLeave = () => {
    if (remainingRef.current > 0) {
      startTimer();
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl min-w-[320px] max-w-[420px] shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-md border border-white/20 text-sm font-medium animate-toastInanimate-[slideInLeft_0.3s_ease] ${toastStyles[toast.type]}`}
    >
      {/* ICON */}
     <Icon className="w-4 h-4 shrink-0 text-gray-300" />

      {/* MESSAGE */}
      <div className="flex-1 leading-snug">
        {toast.message}
      </div>

      {/* CLOSE */}
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-1 rounded-full p-1 opacity-60 hover:opacity-100 hover:bg-white/20 transition"
        aria-label="Close toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};


/* ================= PROVIDER ================= */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [topOffset, setTopOffset] = useState(120);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const header = document.getElementById("main-header");
    if (!header) return;

    const updateOffset = () => {
      setTopOffset(header.offsetHeight);
    };

    updateOffset();

    const observer = new ResizeObserver(() => {
      updateOffset();
    });

    observer.observe(header);

    return () => {
      observer.disconnect();
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  const showToast = (
    message: ReactNode,
    type: ToastType,
    duration = 3200
  ) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const value: ToastContextType = {
    success: (msg, d) => showToast(msg, "success", d),
    error: (msg, d) => showToast(msg, "error", d),
    info: (msg, d) => showToast(msg, "info", d),
    warning: (msg, d) => showToast(msg, "warning", d),
    clearAll: removeAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Only render toasts on the client to avoid SSR hydration mismatches */}
      {mounted && (
        <>
          {/* ===== TOP TOASTS (SUCCESS / ERROR / WARNING SAME) ===== */}
          <div
            style={{ top: `${topOffset}px` }}
            className="fixed left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3"
          >
            {toasts
              .filter((t) => t.type !== "info")
              .map((toast) => (
                <ToastItem
                  key={toast.id}
                  toast={toast}
                  onRemove={removeToast}
                />
              ))}
          </div>

          {/* ===== INFO TOAST (BOTTOM RIGHT PREMIUM) ===== */}
          <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-3">
            {toasts
              .filter((t) => t.type === "info")
              .map((toast) => (
                <ToastItem
                  key={toast.id}
                  toast={toast}
                  onRemove={removeToast}
                />
              ))}
          </div>
        </>
      )}
    </ToastContext.Provider>
  );
};

/* ================= HOOK ================= */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
};
