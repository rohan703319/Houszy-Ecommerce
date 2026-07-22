"use client";

import React, { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

// ========== TYPES ==========
interface ToastProps {
  id: string;
  message: string | ReactNode;
  type?: 'success' | 'error' | 'info' | 'warning';
  autoClose?: number;
  onClose: (id: string) => void;
  pauseOnHover?: boolean;
  draggable?: boolean;
  hideProgressBar?: boolean;
  closeButton?: boolean;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  index?: number;
}

interface ToastOptions {
  type?: 'success' | 'error' | 'info' | 'warning';
  autoClose?: number;
  pauseOnHover?: boolean;
  draggable?: boolean;
  hideProgressBar?: boolean;
  closeButton?: boolean;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

interface ToastContextType {
  toasts: ToastProps[];
  toast: {
    success: (message: string | ReactNode, options?: ToastOptions) => string;
    error: (message: string | ReactNode, options?: ToastOptions) => string;
    info: (message: string | ReactNode, options?: ToastOptions) => string;
    warning: (message: string | ReactNode, options?: ToastOptions) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
    isActive: (id: string) => boolean;
    show: (message: string | ReactNode, options?: ToastOptions) => string;
  };
}

interface ToastProviderProps {
  children: ReactNode;
}

// ========== STYLES ==========
const TOAST_TYPES = {
  success: {
    bg: "bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:bg-none dark:bg-[#16281d]",
    border: "border-green-300/70 dark:border-green-700/40",
    text: "text-green-900 dark:text-green-100",
    icon: "text-green-600 dark:text-green-400",
    progress: "bg-gradient-to-r from-green-500 to-green-600 dark:bg-none dark:bg-green-400",
    iconComponent: CheckCircle,
  },

  error: {
    bg: "bg-gradient-to-br from-red-50 via-red-100 to-red-200 dark:bg-none dark:bg-[#2a1616]",
    border: "border-red-300/70 dark:border-red-700/40",
    text: "text-red-900 dark:text-red-100",
    icon: "text-red-600 dark:text-red-400",
    progress: "bg-gradient-to-r from-red-500 to-red-600 dark:bg-none dark:bg-red-400",
    iconComponent: XCircle,
  },

  info: {
    bg: "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:bg-none dark:bg-[#152330]",
    border: "border-blue-300/70 dark:border-blue-700/40",
    text: "text-blue-900 dark:text-blue-100",
    icon: "text-blue-600 dark:text-blue-400",
    progress: "bg-gradient-to-r from-blue-500 to-blue-600 dark:bg-none dark:bg-blue-400",
    iconComponent: Info,
  },

  warning: {
    bg: "bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 dark:bg-none dark:bg-[#2d2415]",
    border: "border-amber-300/70 dark:border-amber-700/40",
    text: "text-amber-900 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-400",
    progress: "bg-gradient-to-r from-amber-500 to-amber-600 dark:bg-none dark:bg-amber-400",
    iconComponent: AlertTriangle,
  },
};
const ToastContext = createContext<ToastContextType | null>(null);

// ========== TOAST COMPONENT (IMPROVED) ==========
const Toast: React.FC<ToastProps> = ({
  id, message, type = 'info', autoClose = 5000, onClose,
  pauseOnHover = true, draggable = true, hideProgressBar = false, closeButton = true,
  index = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const toastRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, startOffset: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationStartRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const totalPausedRef = useRef<number>(0);
  const isMountedRef = useRef(true); // ✅ FIX: Prevent setState on unmounted

  const style = TOAST_TYPES[type] || TOAST_TYPES.info;
  const IconComponent = style.iconComponent;

  // ✅ FIX: Proper initialization
  useEffect(() => {
    isMountedRef.current = true;
    const timer = requestAnimationFrame(() => {
      if (isMountedRef.current) setIsVisible(true);
    });

    if (autoClose > 0) startAnimation();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cancelAnimationFrame(timer);
    };
  }, [autoClose]);

  // ✅ Animation start
  const startAnimation = () => {
    animationStartRef.current = Date.now();
    totalPausedRef.current = 0;

    if (progressRef.current) {
      progressRef.current.style.width = '100%';
      progressRef.current.style.transition = 'none';

      requestAnimationFrame(() => {
        if (progressRef.current && isMountedRef.current) {
          progressRef.current.style.transition = `width ${autoClose}ms linear`;
          progressRef.current.style.width = '0%';
        }
      });
    }

    timeoutRef.current = setTimeout(handleClose, autoClose);
  };

  // ✅ Pause on hover
  const handleMouseEnter = () => {
    if (!pauseOnHover || isPaused || !isMountedRef.current) return;
    setIsPaused(true);
    pauseStartRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (progressRef.current) {
      const comp = window.getComputedStyle(progressRef.current);
      const width = parseFloat(comp.width);
      const parentWidth = progressRef.current.parentElement?.offsetWidth || 1;
      const widthPercent = (width / parentWidth) * 100;
      progressRef.current.style.transition = 'none';
      progressRef.current.style.width = `${widthPercent}%`;
    }
  };

  // ✅ Resume animation
  const handleMouseLeave = () => {
    if (!pauseOnHover || !isPaused || !isMountedRef.current) return;
    setIsPaused(false);

    const pauseDuration = Date.now() - pauseStartRef.current;
    totalPausedRef.current += pauseDuration;
    const elapsed = Date.now() - animationStartRef.current - totalPausedRef.current;
    const remaining = Math.max(0, autoClose - elapsed);

    if (remaining <= 0) {
      handleClose();
      return;
    }

    if (progressRef.current) {
      requestAnimationFrame(() => {
        if (progressRef.current && isMountedRef.current) {
          progressRef.current.style.transition = `width ${remaining}ms linear`;
          progressRef.current.style.width = '0%';
        }
      });
    }

    timeoutRef.current = setTimeout(handleClose, remaining);
  };

  const handleClose = () => {
    if (!isMountedRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
    setTimeout(() => {
      if (isMountedRef.current) onClose(id);
    }, 300);
  };

  // ✅ Drag to dismiss
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) return;
    e.preventDefault();
    setIsDragging(true);
    if (pauseOnHover && !isPaused) handleMouseEnter();
    dragStartRef.current = { x: e.clientX, startOffset: dragOffset };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !draggable) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const newOffset = dragStartRef.current.startOffset + deltaX;
    setDragOffset(newOffset);
    if (Math.abs(newOffset) > 300) handleClose();
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (isPaused && pauseOnHover) handleMouseLeave();
    if (Math.abs(dragOffset) < 300) setDragOffset(0);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, isPaused]);

  const rotation = isDragging ? Math.min(Math.abs(dragOffset) / 80, 8) * Math.sign(dragOffset) : 0;

  return (
    <div
      ref={toastRef}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        relative w-[92vw] sm:w-[400px] max-w-full rounded-xl border shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-black/40
        overflow-hidden backdrop-blur-xl
        ${style.bg} ${style.border}
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}
        ${isDragging ? 'shadow-2xl scale-105 z-50 cursor-grabbing' : 'cursor-grab hover:shadow-xl dark:hover:shadow-black/50'}
        ${isPaused ? 'ring-1 ring-white/10' : ''}
        transition-all duration-300 ease-out
      `}
      style={{
        transform: `translateX(${dragOffset}px) rotate(${rotation}deg)`,
        opacity: Math.max(0.4, 1 - Math.abs(dragOffset) / 300),
        zIndex: isDragging ? 99999 : 9999 - index,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-start gap-2.5 sm:gap-3 p-3.5 sm:p-4">
        <div className={`flex-shrink-0 mt-0.5 ${style.icon}`}>
          <IconComponent size={24} strokeWidth={2.5} />
        </div>
  <div
  className={`flex-1 text-sm font-medium ${style.text} leading-relaxed min-w-0 max-w-[85%]`}
>
  {typeof message === "string" ? (
    <p className="whitespace-pre-wrap break-words">
      {message}
    </p>
  ) : (
    <div className="break-words">
      {message}
    </div>
  )}
</div>
        {closeButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className={`
              flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center 
              transition-all ${style.text}
              hover:bg-black/5 dark:hover:bg-white/5 active:scale-95
              opacity-60 hover:opacity-100
            `}
            aria-label="Close notification"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {!hideProgressBar && autoClose > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5 dark:bg-white/10 overflow-hidden">
          <div
            ref={progressRef}
            className={`h-full ${style.progress} transition-opacity`}
            style={{
              width: '100%',
              opacity: isPaused ? 0.4 : 1,
            }}
          />
        </div>
      )}

      {/* Pause Indicator */}
      {isPaused && (
        <div className="absolute top-3 right-12 flex gap-1">
          <div className="w-1 h-3 bg-white/60 rounded-full animate-pulse"></div>
          <div className="w-1 h-3 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }}></div>
        </div>
      )}
    </div>
  );
};

// ========== CONTAINER (IMPROVED STACKING) ==========
const ToastContainerByPosition: React.FC<{
  position: string;
  toasts: ToastProps[];
  limit: number;
}> = ({ position, toasts, limit }) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-6 left-6 items-start';
      case 'top-center':
        return 'top-6 left-1/2 -translate-x-1/2 items-center';
      case 'top-right':
        return 'top-6 right-6 items-end';
      case 'bottom-left':
        return 'bottom-6 left-6 items-start flex-col-reverse';
      case 'bottom-center':
        return 'bottom-6 left-1/2 -translate-x-1/2 items-center flex-col-reverse';
      case 'bottom-right':
        return 'bottom-6 right-6 items-end flex-col-reverse';
      default:
        return 'top-6 right-6 items-end';
    }
  };

  const positionToasts = toasts.filter(t => (t.position || 'top-right') === position);
  const limitedToasts = positionToasts.slice(-limit);

  if (limitedToasts.length === 0) return null;

  return (
    <div className={`fixed pointer-events-none flex flex-col gap-2.5 sm:gap-3 z-[9999] ${getPositionClasses()}`}>
      {limitedToasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto transform-gpu transition-all duration-300 ease-out"
          style={{
            transform: `translateY(${index * 0}px) scale(${1 - index * 0.03})`,
            zIndex: limitedToasts.length - index,
            opacity: 1 - index * 0.1,
          }}
        >
          <Toast {...toast} index={index} />
        </div>
      ))}
    </div>
  );
};

// ========== PROVIDER (FIXED) ==========
const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const toastIdRef = useRef(0);

  // ✅ FIX: Use callback to prevent setState during render
  const addToast = (message: string | ReactNode, options: ToastOptions = {}) => {
    const id = `toast-${Date.now()}-${++toastIdRef.current}`;
    const position = options.position || 'top-right';

    setToasts(prev => {
      const isDuplicate = prev.some((t) => {
        if (typeof t.message === "string" && typeof message === "string") {
          return t.message.trim() === message.trim();
        }
        return t.message === message;
      });
      if (isDuplicate) return prev;

      const samePosition = prev.filter(t => t.position === position);
      let updatedToasts = [...prev];

      // Remove oldest if limit exceeded
      if (samePosition.length >= 5) {
        const oldestId = samePosition[0].id;
        updatedToasts = updatedToasts.filter(t => t.id !== oldestId);
      }

      const newToast: ToastProps = {
        id,
        message,
        type: options.type || 'info',
        autoClose: options.autoClose ?? 5000,
        pauseOnHover: options.pauseOnHover ?? true,
        draggable: options.draggable ?? true,
        hideProgressBar: options.hideProgressBar ?? false,
        closeButton: options.closeButton ?? true,
        position,
        onClose: removeToast,
      };

      return [...updatedToasts, newToast];
    });

    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const dismissAll = () => setToasts([]);

  const isActive = (id: string) => toasts.some(toast => toast.id === id);

  const toast = {
    success: (msg: string | ReactNode, opts?: ToastOptions) => addToast(msg, { ...opts, type: 'success' }),
    error: (msg: string | ReactNode, opts?: ToastOptions) => addToast(msg, { ...opts, type: 'error' }),
    info: (msg: string | ReactNode, opts?: ToastOptions) => addToast(msg, { ...opts, type: 'info' }),
    warning: (msg: string | ReactNode, opts?: ToastOptions) => addToast(msg, { ...opts, type: 'warning' }),
    dismiss: removeToast,
    dismissAll,
    isActive,
    show: addToast,
  };

  const positions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      {positions.map(pos => (
        <ToastContainerByPosition key={pos} position={pos} toasts={toasts} limit={5} />
      ))}
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context.toast;
};

export { ToastProvider, useToast };