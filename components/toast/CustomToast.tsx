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
const toastStyles: Record<ToastType, { wrapper: string, icon: string, text: string, bar: string }> = {
  success: {
    wrapper: "bg-white border border-green-200 shadow-[0_12px_34px_rgba(22,163,74,0.18)] ring-1 ring-green-100",
    icon: "text-green-700 bg-green-50",
    text: "text-gray-950",
    bar: "bg-green-600",
  },
  error: {
    wrapper: "bg-white border border-red-200 shadow-[0_12px_34px_rgba(220,38,38,0.2)] ring-1 ring-red-100",
    icon: "text-red-700 bg-red-50",
    text: "text-gray-950",
    bar: "bg-red-600",
  },
  info: {
    wrapper: "bg-white border border-blue-200 shadow-[0_12px_34px_rgba(37,99,235,0.18)] ring-1 ring-blue-100",
    icon: "text-blue-700 bg-blue-50",
    text: "text-gray-950",
    bar: "bg-blue-600",
  },
  warning: {
    wrapper: "bg-white border border-orange-200 shadow-[0_12px_34px_rgba(243,137,24,0.22)] ring-1 ring-orange-100",
    icon: "text-[#b85f00] bg-orange-50",
    text: "text-gray-950",
    bar: "bg-[#f38918]",
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
      className={`relative flex items-center gap-3 overflow-hidden px-3.5 py-2.5 rounded-lg w-[calc(100vw-32px)] sm:w-auto sm:min-w-[300px] sm:max-w-[390px] transition-all animate-[toastAttention_0.34s_cubic-bezier(0.16,1,0.3,1)] ${styles.wrapper}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${styles.bar}`} />

      {/* ICON */}
      <div className={`shrink-0 p-1.5 rounded-full ${styles.icon}`}>
        <Icon className="w-[18px] h-[18px]" />
      </div>

      {/* MESSAGE */}
      <div className={`flex-1 leading-snug font-semibold text-[12px] sm:text-[13px] ${styles.text}`}>
        {toast.message}
      </div>

      {/* CLOSE */}
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-0.5 rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Close toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};


const extractTextContent = (node: ReactNode): string => {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextContent).join("");
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: ReactNode } | null | undefined;
    return extractTextContent(props?.children);
  }
  return "";
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
    setToasts((prev) => {
      const newText = extractTextContent(message).trim();

      const filtered = prev.filter((t) => {
        if (type === "success" && t.type === "success") {
          return false;
        }
        if (newText.length > 0) {
          const existingText = extractTextContent(t.message).trim();
          if (existingText === newText) {
            return false;
          }
        }
        return true;
      });

      const id = crypto.randomUUID();
      return [...filtered, { id, message, type, duration }];
    });
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
          <style>{`
            @keyframes toastAttention {
              0% {
                opacity: 0;
                transform: translateY(-16px) scale(0.96);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>

          {/* ===== TOP TOASTS (SUCCESS / ERROR / WARNING SAME) ===== */}
          <div
            style={{ top: `${topOffset}px` }}
            className="fixed left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 items-center"
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
