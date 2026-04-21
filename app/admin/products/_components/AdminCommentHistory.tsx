'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, User, MessageSquare, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatDateOnly, formatTime } from '@/app/admin/_utils/formatUtils';
import productsService from '@/lib/services/products';

// ============================================
// TYPES
// ============================================
export interface AdminCommentHistory {
  id: string;
  productId: string;
  oldComment: string | null;
  newComment: string | null;
  changedBy: string;
  changedAt: string;
}

interface AdminCommentHistoryProps {
  productId: string;
  renderButton?: (onClick: () => void, count: number) => React.ReactNode;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminCommentHistory({ 
  productId, 
  renderButton 
}: AdminCommentHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<AdminCommentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const modalContentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  // ============================================
  // FETCH HISTORY - STABLE WITH useCallback
  // ============================================
  const fetchHistory = useCallback(async () => {
    // ✅ Prevent duplicate fetches
    if (fetchInProgressRef.current || !productId || !isOpen) return;
    
    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
   const response = await productsService.getAdminCommentHistory(productId);
      
      let historyData: AdminCommentHistory[] = [];
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        historyData = response.data.data;
      } else if (Array.isArray(response.data)) {
        historyData = response.data;
      } else {
        historyData = [];
      }
      
      const sortedHistory = [...historyData].sort((a, b) => 
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
      );
      
      if (isMountedRef.current) {
        setHistory(sortedHistory);
      }
      
    } catch (error: any) {
      console.error('Error fetching comment history:', error);
      if (isMountedRef.current && error.response?.status !== 404) {
        setError('Failed to load comment history');
      }
      if (isMountedRef.current) {
        setHistory([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchInProgressRef.current = false;
    }
  }, [productId, isOpen]); // ✅ isOpen dependency added

  // ============================================
  // OPEN MODAL - SINGLE SOURCE OF TRUTH
  // ============================================
  const handleOpen = useCallback(() => {
    if (isOpen) return; // ✅ Prevent double open
    
    scrollPositionRef.current = window.scrollY;
    setIsOpen(true);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (!isOpen) return; // ✅ Prevent double close
    
    setIsOpen(false);
    // ✅ Clear history when closing (optional)
    // setHistory([]);
  }, [isOpen]);

  // ============================================
  // FETCH WHEN MODAL OPENS
  // ============================================
  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  // ============================================
  // BODY SCROLL LOCK & ESC KEY - STABLE
  // ============================================
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    
    if (isOpen) {
      // Save scroll position and lock body
      const scrollY = scrollPositionRef.current;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, handleClose]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ============================================
  // PREVENT MODAL CONTENT SCROLL BUBBLING
  // ============================================
  const handleModalContentScroll = useCallback((e: React.WheelEvent) => {
    const container = modalContentRef.current;
    if (!container) return;

    const isAtTop = container.scrollTop === 0;
    const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;

    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      e.preventDefault();
    }
  }, []);

  // ============================================
  // BUTTON COMPONENT - MEMOIZED
  // ============================================
  const ButtonComponent = useMemo(() => {
    if (renderButton) {
      return renderButton(handleOpen, history.length);
    }
    
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 
                   border border-violet-500/30 rounded-lg text-sm text-violet-400 
                   hover:text-violet-300 transition-all group"
      >
        <History className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        <span>Comment History</span>
        {history.length > 0 && (
          <span className="px-2 py-0.5 bg-violet-500/20 rounded-full text-xs font-semibold">
            {history.length}
          </span>
        )}
      </button>
    );
  }, [renderButton, handleOpen, history.length]);

  // ============================================
  // MODAL CONTENT - MEMOIZED
  // ============================================
  const ModalContent = useMemo(() => {
    if (!isOpen) return null;
    
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <div 
          className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                     border-2 border-violet-500/30 rounded-2xl shadow-2xl w-full max-w-6xl 
                     overflow-hidden animate-in fade-in zoom-in duration-200"
          style={{ maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 
                        bg-slate-800/50 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 
                            flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Admin Comment History</h2>
                <p className="text-xs text-slate-400 mt-0.5">Track all changes to admin comments</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-all 
                       text-slate-400 hover:text-white hover:rotate-90 duration-200"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div 
            ref={modalContentRef}
            onWheel={handleModalContentScroll}
            className="overflow-y-auto"
            style={{ maxHeight: 'calc(85vh - 120px)' }}
          >
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-violet-500 
                                border-r-transparent border-b-transparent border-l-transparent 
                                rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-400 text-sm mt-4">Loading history...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 
                              flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-400 text-sm font-medium">{error}</p>
                <button 
                  onClick={fetchHistory} 
                  className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && history.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 rounded-full bg-slate-800/50 border border-slate-700 
                              flex items-center justify-center mb-4">
                  <MessageSquare className="w-12 h-12 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No History Available</h3>
                <p className="text-slate-400 text-sm text-center max-w-md">
                  Admin comment changes will appear here once someone updates the internal notes.
                </p>
              </div>
            )}

            {/* History Table */}
            {!loading && !error && history.length > 0 && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-slate-300">
                      Total Changes: <span className="font-bold text-violet-400">{history.length}</span>
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Latest changes shown first</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead className="sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10">
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-3 text-xs font-bold text-violet-300 uppercase w-12">#</th>
                        <th className="text-left py-3 px-3 text-xs font-bold text-violet-300 uppercase min-w-[150px]">Changed By</th>
                        <th className="text-left py-3 px-3 text-xs font-bold text-violet-300 uppercase min-w-[120px]">Date & Time</th>
                        <th className="text-left py-3 px-3 text-xs font-bold text-violet-300 uppercase min-w-[250px]">Old Comment</th>
                        <th className="text-left py-3 px-3 text-xs font-bold text-violet-300 uppercase min-w-[250px]">New Comment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {history.map((entry, index) => (
                        <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold">
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-violet-300">
                                  {entry.changedBy.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-100 truncate">
                                  {entry.changedBy.split('@')[0]}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{entry.changedBy}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <p className="text-sm text-slate-200">{formatDateOnly(entry.changedAt)}</p>
                            <p className="text-xs text-slate-500">{formatTime(entry.changedAt)}</p>
                          </td>
                          <td className="py-3 px-3">
                            {entry.oldComment ? (
                              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                                <p className="text-xs text-slate-200 line-clamp-3 break-words">{entry.oldComment}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic">No previous comment</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {entry.newComment ? (
                              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                                <p className="text-xs text-slate-200 line-clamp-3 break-words">{entry.newComment}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Comment removed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div className="px-6 py-3 bg-slate-800/50 border-t border-slate-700 
                          flex items-center justify-between sticky bottom-0">
              <p className="text-sm text-slate-300">
                Total Changes: <span className="font-bold text-violet-400">{history.length}</span>
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <ChevronLeft className="w-3 h-3" />
                Scroll for more
                <ChevronRight className="w-3 h-3" />
              </p>
              <kbd className="px-2 py-1 bg-slate-700 rounded text-slate-400 text-[10px] font-mono">Esc</kbd>
            </div>
          )}
        </div>
      </div>
    );
  }, [isOpen, loading, error, history, handleClose, handleModalContentScroll, fetchHistory]);

  // ============================================
  // ✅ MAIN RETURN
  // ============================================
  return (
    <>
      {ButtonComponent}
      {isOpen && typeof window !== 'undefined' && createPortal(ModalContent, document.body)}
    </>
  );
}