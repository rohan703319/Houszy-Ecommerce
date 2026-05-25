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
const toastStyles: Record<ToastType, { wrapper: string, icon: string, text: string }> = {
  success: {
    wrapper: "bg-white border border-green-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
    icon: "text-green-600 bg-green-50",
    text: "text-gray-900"
  },
  error: {
    wrapper: "bg-white border border-red-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
    icon: "text-red-500 bg-red-50",
    text: "text-gray-900"
  },
  info: {
    wrapper: "bg-white border border-blue-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
    icon: "text-blue-600 bg-blue-50",
    text: "text-gray-900"
  },
  warning: {
    wrapper: "bg-white border border-orange-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
    icon: "text-[#f38918] bg-orange-50",
    text: "text-gray-900"
  },
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

  const styles = toastStyles[toast.type];

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl min-w-[320px] max-w-[420px] transition-all animate-toastInanimate-[slideInLeft_0.3s_ease] ${styles.wrapper}`}
    >
      {/* ICON */}
      <div className={`shrink-0 p-2 rounded-full ${styles.icon}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* MESSAGE */}
      <div className={`flex-1 leading-snug font-semibold text-[13px] ${styles.text}`}>
        {toast.message}
      </div>

      {/* CLOSE */}
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-1 rounded-full p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
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
            className="fixed right-4 z-[9999] flex flex-col gap-3 items-end"
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
