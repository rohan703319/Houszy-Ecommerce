'use client';

import { useEffect } from 'react';
import { X, Clock, Users, Info, ArrowLeft, Send } from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface ProductLockModalProps {
  isOpen: boolean;
  lockedByEmail: string;
  expiresAt: string | null | undefined;
  onClose: () => void;
  onRequestTakeover: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProductLockModal({
  isOpen,
  lockedByEmail,
  expiresAt,
  onClose,
  onRequestTakeover,
}: ProductLockModalProps) {

  // ============================================
  // FORMAT EXPIRY TIME
  // ============================================
  const formatExpiryTime = (expiryDate: string | null | undefined): string => {
    if (!expiryDate) return 'Unknown';
    
    try {
      return new Date(expiryDate).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return 'Unknown';
    }
  };

  // ============================================
  // ESC KEY HANDLER & BODY SCROLL LOCK
  // ============================================
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // ============================================
  // DON'T RENDER IF NOT OPEN
  // ============================================
  if (!isOpen) return null;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-red-500/20 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* ========== HEADER ========== */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          {/* Left side: Lock icon + Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-white">
              Product Locked
            </h2>
          </div>
          
          {/* Right side: Close button */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all hover:rotate-90 duration-300"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* ========== BODY ========== */}
        <div className="px-5 py-4 space-y-3">
          
          {/* Editor info card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">Currently Editing</p>
                <p className="text-white text-sm font-medium truncate">
                  {lockedByEmail || 'admin@ecommerce.com'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Lock expiry info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Lock Expires At</p>
                <p className="text-white text-sm font-medium">
                  {formatExpiryTime(expiresAt)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Info alert */}
          <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-200 text-sm font-medium">
                What can you do?
              </p>
              <p className="text-amber-100/70 text-xs leading-relaxed mt-0.5">
                Wait for the lock to expire automatically, or request takeover from the current editor to gain immediate access.
              </p>
            </div>
          </div>
        </div>
        
        {/* ========== FOOTER ========== */}
        <div className="px-5 py-3 bg-slate-900/50 border-t border-slate-700 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl font-medium transition-all flex items-center justify-center gap-2 group border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          
          <button
            onClick={onRequestTakeover}
            className="flex-1 px-3 py-2.5 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white text-sm rounded-xl font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
          >
            <Send className="w-4 h-4" />
            Request Takeover
          </button>
        </div>
      </div>
    </div>
  );
}