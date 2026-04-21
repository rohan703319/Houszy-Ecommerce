'use client';

import { useEffect } from 'react';
import { X, Save, Info } from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface UnsavedChangesModalProps {
  isOpen: boolean;
  missingFields: string[];
  changedFieldsList: string[];
  changedFieldsCount: number;
  isSubmitting: boolean;
  
  // Validation status
  canSaveDraft: boolean;
  canUpdate: boolean;
  
  // Callbacks
  onSaveDraft: () => void;
  onUpdate: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function UnsavedChangesModal({
  isOpen,
  missingFields,
  changedFieldsList,
  changedFieldsCount,
  isSubmitting,
  canSaveDraft,
  canUpdate,
  onSaveDraft,
  onUpdate,
  onDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  
  // ============================================
  // ESC KEY HANDLER
  // ============================================
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  // ============================================
  // DON'T RENDER IF NOT OPEN
  // ============================================
  if (!isOpen) return null;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl max-w-2xl w-full animate-slideUp">
        
        {/* ========== HEADER ========== */}
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">Unsaved Changes Detected</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                You have made changes that haven't been saved yet
              </p>
            </div>

            <button 
              onClick={onCancel} 
              className="text-slate-500 hover:text-white transition-colors p-1"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========== BODY ========== */}
        <div className="px-6 py-5">
          <p className="text-slate-300 text-sm mb-4">
            Choose how you want to proceed with your changes:
          </p>
          
          {/* Changed Fields Summary */}
          {changedFieldsCount > 0 && (
            <div className="mb-5 p-4 bg-slate-800/50 border border-slate-700 rounded-xl max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-cyan-400 mb-1.5">
                    Modified Fields ({changedFieldsCount})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {changedFieldsList.slice(0, 15).map((field, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs rounded-md"
                      >
                        {field}
                      </span>
                    ))}
                    {changedFieldsCount > 15 && (
                      <span className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs rounded-md font-semibold">
                        +{changedFieldsCount - 15} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Missing Fields Warning */}
          {missingFields.length > 0 && (
            <div className="mb-5 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-orange-300">
                    ⚠️ {missingFields.length} required field{missingFields.length !== 1 ? 's' : ''} missing for publishing
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Update Draft Button */}
            <button
              onClick={onSaveDraft}
              disabled={!canSaveDraft || isSubmitting}
              className="group p-4 bg-slate-700 hover:bg-slate-600 border-2 border-transparent hover:border-slate-500 text-left rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-600 group-hover:bg-slate-500 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                  <Save className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm mb-1">Update Draft</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Save changes and leave. Publish later.
                  </p>
                </div>
              </div>
            </button>

            {/* Update Product Button */}
            <button
              onClick={onUpdate}
              disabled={!canUpdate || isSubmitting}
              className="group p-4 bg-gradient-to-br from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-2 border-transparent hover:border-violet-400 text-left rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 group-hover:bg-white/30 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm mb-1">Update Product</h4>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {missingFields.length > 0 
                      ? `${missingFields.length} field${missingFields.length !== 1 ? 's' : ''} required`
                      : 'Publish changes and leave'
                    }
                  </p>
                </div>
              </div>
            </button>

            {/* Discard Changes Button */}
            <button
              onClick={onDiscard}
              disabled={isSubmitting}
              className="group p-4 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 hover:border-red-500/50 text-left rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-500/20 group-hover:bg-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-red-400 text-sm mb-1">Discard Changes</h4>
                  <p className="text-xs text-red-300/70 leading-relaxed">
                    Leave without saving. All changes lost.
                  </p>
                </div>
              </div>
            </button>

            {/* Stay on Page Button */}
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="group p-4 bg-slate-800/50 hover:bg-slate-700/50 border-2 border-slate-700 hover:border-slate-600 text-left rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-700 group-hover:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-300 text-sm mb-1">Stay on Page</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Continue editing. Don't leave yet.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ========== FOOTER ========== */}
        <div className="px-6 py-3 bg-slate-800/30 rounded-b-2xl border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">
            💡 Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">Esc</kbd> to stay on page
          </p>
        </div>
      </div>
    </div>
  );
}