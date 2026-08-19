"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LucideIcon, AlertCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => any;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: LucideIcon;
  iconColor?: string;
  confirmButtonStyle?: string;
  isLoading?: boolean;
  confirmButtonClass?: string;
  closeOnEsc?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  icon: Icon = AlertCircle,
  iconColor = "text-red-400",
  confirmButtonStyle = "bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/50",
  isLoading = false,
  closeOnEsc = true,
}) => {
  // State for closing animation
  const [isClosing, setIsClosing] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
      setIsClosing(false);
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen || !closeOnEsc || isLoading) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, closeOnEsc, isLoading]);

  // Handle close with animation
  const handleClose = () => {
    if (isLoading) return;
    
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  // Don't render if not open and not closing
  if (!isOpen && !isClosing) return null;

  const handleConfirmClick = async () => {
    const result = onConfirm();
    if (result instanceof Promise) {
      try {
        await result;
      } catch (err) {
        // Errors are handled by the parent component's handler.
        // We catch here to prevent unhandled promise rejection and ensure handleClose runs.
      }
    }
    handleClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleClose();
    }
  };

  const modalContent = (
    <>
      {/* BACKDROP */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] transition-all duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* MODAL WRAPPER */}
      <div
        className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }}
      >
        {/* MODAL CONTENT */}
        <div
          className={`relative bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl transition-all duration-200 ${
            isClosing
              ? 'opacity-0 scale-95'
              : 'opacity-100 scale-100'
          }`}
          style={{
            pointerEvents: 'auto',
            maxHeight: '90vh',
            overflow: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Close button */}
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Close"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white text-center mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-slate-400 text-center mb-6 leading-relaxed">
              {message}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isLoading}
                type="button"
                className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirmClick}
                disabled={isLoading}
                type="button"
                className={`flex-1 px-4 py-3 text-white rounded-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonStyle}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
};

export default ConfirmDialog;