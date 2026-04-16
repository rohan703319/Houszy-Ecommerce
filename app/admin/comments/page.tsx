"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Clock, CheckCircle, X, Search, FilterX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Trash2, AlertCircle, Ban, Filter, Reply, Shield, ShieldOff, AlertTriangle, CornerDownRight, User, ChevronDown, RefreshCw, Plus, FolderTree, FileText } from "lucide-react";
import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import { blogCommentsService, BlogComment, BlogPost } from "@/lib/services/blogComments";
import { formatDate } from "../_utils/formatUtils";


export default function CommentsPage() {

  const toast = useToast();
  const router = useRouter();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [postFilter, setPostFilter] = useState<string>("all");

  const [viewingComment, setViewingComment] = useState<BlogComment | null>(null);
  const [replyingTo, setReplyingTo] = useState<BlogComment | null>(null);
  const [replyText, setReplyText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; author: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);


  // User Authentication State
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("Admin User");

  // ✅ Spam Flag Modal State
  const [spamFlagModal, setSpamFlagModal] = useState<{
    comment: BlogComment;
    reason: string;
    spamScore: number;
    flaggedBy: string;
  } | null>(null);

  const [dateRange, setDateRange] = useState<{
  startDate: string;
  endDate: string;
}>({
  startDate: "",
  endDate: ""
});
const [showDatePicker, setShowDatePicker] = useState(false);
const datePickerRef = useRef<HTMLDivElement>(null);
  const [isSubmittingSpam, setIsSubmittingSpam] = useState(false);

  const [showPostDropdown, setShowPostDropdown] = useState(false);
  const [postSearchTerm, setPostSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPostDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter posts based on search
  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(postSearchTerm.toLowerCase())
  );
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
      setShowDatePicker(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
  // Get current user from token
  useEffect(() => {
    const email = localStorage.getItem('userEmail') || 'admin@ecom.com';
    const storedUserData = localStorage.getItem('userData');

    setCurrentUserEmail(email);

    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        let firstName = userData.firstName || '';
        let lastName = userData.lastName || '';
        let userId = userData.id || '';

        if (!firstName || !lastName || !userId) {
          const token = localStorage.getItem('authToken');
          
          if (token) {
            try {
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const tokenData = JSON.parse(jsonPayload);
              firstName = firstName || tokenData.firstName || '';
              lastName = lastName || tokenData.lastName || '';
              userId = userId || tokenData.sub || tokenData.userId || tokenData.id || '';
            } catch (err) {
              console.error('Token decode error:', err);
            }
          }
        }

        const fullName = `${firstName} ${lastName}`.trim() || 'Admin User';
        setUserName(fullName);
        setCurrentUserId(userId);
      } catch (error) {
        setUserName('Admin User');
      }
    }
  }, []);

  // ✅ Open Spam Flag Modal
  const openSpamFlagModal = (comment: BlogComment) => {
    setSpamFlagModal({
      comment,
      reason: '',
      spamScore: 0,
      flaggedBy: userName
    });
  };

// ✅ Add this function with your other action handlers (after handleDelete)
const handleUndelete = async (commentId: string) => {
  if (actionLoading === commentId) return;
  
  setActionLoading(commentId);
  
  try {
    console.log("🔄 Starting undelete process for comment:", commentId);
    
    const response = await blogCommentsService.undelete(commentId);
    
    console.log("✅ Undelete API response:", response.data);
    
    if (response.data?.success) {
      toast.success(response.data.message || "Comment restored successfully! ↩️");
      await fetchBlogPosts();
    } else {
      // ✅ FIXED: Better error handling
      const errorMessage = response.data?.message || "Failed to restore comment";
      
      // Check specific error types
      if (errorMessage.toLowerCase().includes("not deleted")) {
        toast.error("⚠️ This comment is already active!");
      } else if (errorMessage.toLowerCase().includes("not found")) {
        toast.error("❌ Comment not found!");
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
      
      console.log("❌ Undelete failed:", errorMessage);
    }
    
  } catch (error: any) {
    console.error("❌ Error undeleting comment:", error);
    
    const errorMessage = 
      error?.response?.data?.message || 
      error?.response?.data?.errors?.[0] ||
      error?.message || 
      "Failed to restore comment. Please try again.";
    
    // ✅ Better error display
    if (errorMessage.toLowerCase().includes("not deleted")) {
      toast.error("⚠️ This comment is already active!");
    } else {
      toast.error(`❌ ${errorMessage}`);
    }
    
    console.error("Error details:", {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
    });
    
  } finally {
    setActionLoading(null);
  }
};

// handleSubmitSpamFlag function me console add karo
const handleSubmitSpamFlag = async () => {
  if (!spamFlagModal) return;

  if (!spamFlagModal.reason.trim()) {
    toast.error("Please enter a reason for flagging");
    return;
  }

  setIsSubmittingSpam(true);
  try {


    // ✅ This will now work with query params
    const response = await blogCommentsService.flagAsSpam(
      spamFlagModal.comment.id,
      spamFlagModal.reason,
      spamFlagModal.spamScore,
      spamFlagModal.flaggedBy
    );

    console.log("✅ Response:", response.data);

    if (response.data?.success) {
      toast.success("Comment flagged as spam successfully! 🚩");
      setSpamFlagModal(null);
      await fetchBlogPosts(); // Refresh data
    } else {
      toast.error(response.data?.message || "Failed to flag as spam");
    }
  } catch (error: any) {
    console.error("❌ Error:", error);
    const errorMessage = 
      error?.response?.data?.message || 
      error?.response?.data?.errors?.[0] ||
      error?.message || 
      "Failed to flag as spam";
    toast.error(errorMessage);
  } finally {
    setIsSubmittingSpam(false);
  }
};


  // Helper functions
  const flattenComments = (comments: BlogComment[]): BlogComment[] => {
    const flattened: BlogComment[] = [];
    const processedIds = new Set<string>();

    const flatten = (comment: BlogComment) => {
      if (processedIds.has(comment.id)) return;
      processedIds.add(comment.id);
      flattened.push(comment);
      
      if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
        comment.replies.forEach(reply => flatten(reply));
      }
    };

    comments.forEach(comment => flatten(comment));
    return flattened;
  };

  const isAdminComment = (comment: BlogComment): boolean => {
    return comment.userId === currentUserId || comment.authorEmail === currentUserEmail;
  };

  const getParentComments = (): BlogComment[] => {
    const parents = comments.filter(comment => !comment.parentCommentId);
    return parents;
  };

  const getReplies = (parentId: string): BlogComment[] => {
    return comments.filter(comment => comment.parentCommentId === parentId);
  };

  // Fetch Blog Posts
  const fetchBlogPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await blogCommentsService.getAllPosts();
      if (response.data?.success && Array.isArray(response.data.data)) {
        const activePosts = response.data.data.filter(post => !post.isDeleted);
        setBlogPosts(activePosts);
      } else {
        setBlogPosts([]);
      }
    } catch (error: any) {
      console.error("Error fetching blog posts:", error);
      toast.error("Failed to load blog posts");
      setBlogPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

const fetchComments = async (specificPostId?: string) => {
  setLoadingComments(true);
  try {
    const allCommentsFromPosts: BlogComment[] = [];
    
    blogPosts
      .filter(post => !post.isDeleted)
      .forEach(post => {
        if (post.comments && Array.isArray(post.comments) && post.comments.length > 0) {
          const postComments = flattenComments(post.comments).map(comment => ({
            ...comment,
            blogPostTitle: comment.blogPostTitle || post.title,
            blogPostId: post.id,
            blogSlug: post.slug,
          }));
          allCommentsFromPosts.push(...postComments);
        }
      });

    let filteredComments = allCommentsFromPosts;

    // Filter by Status
    if (statusFilter === "approved") {
      filteredComments = filteredComments.filter(c => c.isApproved && !c.isSpam && !c.isDeleted);
    } else if (statusFilter === "pending") {
      filteredComments = filteredComments.filter(c => !c.isApproved && !c.isSpam && !c.isDeleted);
    } else if (statusFilter === "spam") {
      filteredComments = filteredComments.filter(c => c.isSpam && !c.isDeleted);
    } else if (statusFilter === "deleted") {
      filteredComments = filteredComments.filter(c => c.isDeleted);
    }

    // Filter by Post
    if (specificPostId && specificPostId !== "all") {
      filteredComments = filteredComments.filter(c => c.blogPostId === specificPostId);
    } else if (postFilter !== "all") {
      filteredComments = filteredComments.filter(c => c.blogPostId === postFilter);
    }

    // ✅ Filter by Date Range
    if (dateRange.startDate || dateRange.endDate) {
      filteredComments = filteredComments.filter(c => {
        const commentDate = new Date(c.createdAt);
        const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const end = dateRange.endDate ? new Date(dateRange.endDate) : null;

        // Set time to start/end of day for accurate comparison
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        if (start && end) {
          return commentDate >= start && commentDate <= end;
        } else if (start) {
          return commentDate >= start;
        } else if (end) {
          return commentDate <= end;
        }
        return true;
      });
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredComments = filteredComments.filter(c => 
        c.authorName?.toLowerCase().includes(searchLower) ||
        c.authorEmail?.toLowerCase().includes(searchLower) ||
        c.commentText?.toLowerCase().includes(searchLower) ||
        c.blogPostTitle?.toLowerCase().includes(searchLower)
      );
    }

    setComments(filteredComments);
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    toast.error("Failed to load comments");
    setComments([]);
  } finally {
    setLoadingComments(false);
  }
};

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBlogPosts();
      setLoading(false);
    };
    loadData();
  }, []);

useEffect(() => {
  if (blogPosts.length > 0) {
    fetchComments(postFilter);
  }
}, [blogPosts, postFilter, statusFilter, dateRange]);

  // Action handlers
  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await blogCommentsService.approve(id);
      if (response.data?.success) {
        toast.success("Comment approved successfully!");
        await fetchBlogPosts();
      } else {
        toast.error(response.data?.message || "Failed to approve comment");
      }
    } catch (error: any) {
      console.error("Error approving comment:", error);
      toast.error(error?.response?.data?.message || "Failed to approve comment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await blogCommentsService.delete(id);
      if (response.data?.success) {
        toast.success("Comment deleted successfully!");
        setDeleteConfirm(null);
        await fetchBlogPosts();
      } else {
        toast.error(response.data?.message || "Failed to delete comment");
      }
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.errors?.[0] || error?.message || "Failed to delete comment";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnflagSpam = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await blogCommentsService.unflagSpam(id);
      if (response.data?.success) {
        toast.success("Comment restored from spam!");
        await fetchBlogPosts();
      } else {
        toast.error(response.data?.message || "Failed to restore comment");
      }
    } catch (error: any) {
      console.error("Error unflagging spam:", error);
      toast.error(error?.response?.data?.message || "Failed to restore comment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReply = async () => {
    if (!replyingTo || !replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    setActionLoading(replyingTo.id);
    try {
      const response = await blogCommentsService.replyToComment(replyingTo.id, {
        parentCommentId: replyingTo.id,
        commentText: replyText,
        authorName: userName,
        userId: currentUserId
      });

      if (response.data?.success) {
        toast.success("Reply posted successfully!");
        setReplyingTo(null);
        setReplyText("");
        await fetchBlogPosts();
      } else {
        toast.error(response.data?.message || "Failed to post reply");
      }
    } catch (error: any) {
      console.error("Error posting reply:", error);
      toast.error(error?.response?.data?.message || "Failed to post reply");
    } finally {
      setActionLoading(null);
    }
  };
// ✅ Initial load
useEffect(() => {
  if (blogPosts.length > 0) {
    fetchComments();
  }
}, [blogPosts]);
  // Filter and pagination
  const filteredComments = getParentComments().filter(comment => {
    const matchesSearch = 
      comment.commentText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.authorEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "approved" && comment.isApproved && !comment.isSpam) ||
      (statusFilter === "pending" && !comment.isApproved && !comment.isSpam) ||
      (statusFilter === "spam" && comment.isSpam);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: getParentComments().length,
    pending: getParentComments().filter(c => !c.isApproved && !c.isSpam).length,
    approved: getParentComments().filter(c => c.isApproved && !c.isSpam).length,
    spam: comments.filter(c => c.isSpam).length,
  };

  const totalItems = filteredComments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredComments.slice(startIndex, endIndex);

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (endPage - startPage < maxVisiblePages - 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

const clearFilters = () => {
  setStatusFilter("all");
  setPostFilter("all");
  setSearchTerm("");
  setPostSearchTerm("");
  setShowPostDropdown(false);
  setDateRange({ startDate: "", endDate: "" }); // ✅ Clear date range
};
const hasActiveFilters = 
  statusFilter !== "all" || 
  postFilter !== "all" || 
  searchTerm.trim() !== "" ||
  dateRange.startDate !== "" ||
  dateRange.endDate !== "";
// ✅ Add this helper function
const getDateRangeLabel = () => {
  if (!dateRange.startDate && !dateRange.endDate) return "Select Date Range";
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (dateRange.startDate && dateRange.endDate) {
    return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
  } else if (dateRange.startDate) {
    return `From ${formatDate(dateRange.startDate)}`;
  } else if (dateRange.endDate) {
    return `Until ${formatDate(dateRange.endDate)}`;
  }
  return "Select Date Range";
};

  const getSelectedPostTitle = () => {
    if (postFilter === "all") return "All Posts";
    const post = blogPosts.find(p => p.id === postFilter);
    return post?.title || "Unknown Post";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
       <div className="mx-auto space-y-2">
{/* Header */}
<div className="flex flex-wrap items-center justify-between gap-3">

  <div>
    <h1 className="text-xl font-semibold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
      Comments Management
    </h1>
    <p className="text-[13px] text-slate-500">
      Moderate and manage blog comments
    
    </p>
  </div>

  <div className="flex flex-wrap gap-2">

    {/* Blog Categories */}
    <button
      onClick={() => router.push('/admin/BlogCategories')}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-md hover:opacity-90"
    >
      <FolderTree className="h-3 w-3" />
     Go toBlog Category Page
    </button>

    {/* Blog Posts */}
    <button
      onClick={() => router.push("/admin/BlogPosts")}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-md hover:opacity-90"
    >
      <FileText className="h-3 w-3" />
     Go to Blog Post Page
    </button>

    {/* Refresh */}
    <button
      onClick={fetchBlogPosts}
      disabled={loadingComments}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-slate-800/60 border border-slate-700 rounded-md text-white"
    >
      {loadingComments ? (
        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <RefreshCw className="h-3 w-3" />
      )}
      Refresh
    </button>

  </div>
</div>


{/* Stats Cards */}
<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">

  {/* Total */}
  <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-blue-500/10 rounded-md flex items-center justify-center">
        <MessageSquare className="h-4 w-4 text-blue-400" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[12px] text-slate-200">Total</p>
        <p className="text-lg font-semibold text-white">{stats.total}</p>
      </div>
    </div>
  </div>

  {/* Pending */}
  <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-yellow-500/10 rounded-md flex items-center justify-center">
        <Clock className="h-4 w-4 text-yellow-400" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[12px] text-slate-200">Pending</p>
        <p className="text-lg font-semibold text-white">{stats.pending}</p>
      </div>
    </div>
  </div>

  {/* Approved */}
  <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-green-500/10 rounded-md flex items-center justify-center">
        <CheckCircle className="h-4 w-4 text-green-400" />
      </div>
      <div>
        <p className="text-[12px] text-slate-200">Approved</p>
        <p className="text-lg font-semibold text-white">{stats.approved}</p>
      </div>
    </div>
  </div>

  {/* Spam */}
  <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-red-500/10 rounded-md flex items-center justify-center">
        <Ban className="h-4 w-4 text-red-400" />
      </div>
      <div>
        <p className="text-[12px] text-slate-200">Spam</p>
        <p className="text-lg font-semibold text-white">{stats.spam}</p>
      </div>
    </div>
  </div>

</div>


{/* Items Per Page */}
<div className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2">

  <div className="flex flex-wrap items-center justify-between gap-2">

    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-500">Show</span>

      <select
        value={itemsPerPage}
        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
        className="px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-md text-white text-[11px]"
      >
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={75}>75</option>
        <option value={100}>100</option>
      </select>

      <span className="text-[11px] text-slate-500">per page</span>
    </div>

    <div className="text-[11px] text-slate-500">
      {loadingComments
        ? "Loading..."
        : `${totalItems > 0 ? startIndex + 1 : 0} – ${Math.min(endIndex, totalItems)} of ${totalItems}`}
    </div>

  </div>
</div>

        {/* Comments Section */}
<div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-2">
  {/* Header */}

   <div className="group flex flex-col lg:flex-row gap-2.5 rounded-xl border border-slate-800/70 bg-slate-950/30 px-2 py-2">
        {/* Search Input */}
        <div className="relative lg:flex-1  max-w-[340px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search comments..."
            className="w-full px-3.5 py-2 pl-10 pr-10 bg-slate-800/50 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-slate-500 transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded transition-all"
            >
              <X className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
            </button>
          )}
        </div>
      {/* Left Side: Status + Post Filter */}
      <div className={`flex flex-wrap items-center gap-2.5 flex-1 transition-all duration-200 ${hasActiveFilters ? "opacity-100" : "opacity-70 group-hover:opacity-100 group-focus-within:opacity-100"}`}>
        {/* Status Filter */}
        <div className="relative  ">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3.5 py-2 bg-slate-800/90 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all min-w-[170px] appearance-none cursor-pointer ${
              statusFilter !== "all" 
                ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/50" 
                : "border-slate-600 hover:border-slate-500"
            }`}
          >
            <option value="all">All Status</option>
            <option value="approved">✓ Approved</option>
            <option value="pending">⏳ Pending</option>
            <option value="spam">🚩 Spam</option>
            <option value="deleted">🗑️ Deleted</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
    {/* Right Side: Date Range + Search */}
      <div className={`flex items-center gap-2.5 flex-1 min-w-[200px] lg:flex-initial transition-all duration-200 ${hasActiveFilters ? "opacity-100" : "opacity-70 group-hover:opacity-100 group-focus-within:opacity-100"}`}>
        {/* ✅ Date Range Filter - AUTO APPLY */}
        <div className="relative flex-1" ref={datePickerRef}>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`w-full px-3.5 py-2 pl-10 pr-10 bg-slate-800/50 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all text-left ${
                (dateRange.startDate || dateRange.endDate)
                  ? "border-green-500 bg-green-500/10 ring-2 ring-green-500/50" 
                  : "border-slate-600 hover:border-slate-500"
              }`}
            >
              <span className={dateRange.startDate || dateRange.endDate ? "text-white" : "text-slate-400"}>
                {getDateRangeLabel()}
              </span>
            </button>
            
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            
            {(dateRange.startDate || dateRange.endDate) ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDateRange({ startDate: "", endDate: "" });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded transition-all"
              >
                <X className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
              </button>
            ) : (
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none transition-transform ${showDatePicker ? "rotate-180" : ""}`} />
            )}
          </div>

          {/* ✅ Date Picker Dropdown - AUTO CLOSE ON SELECT */}
          {showDatePicker && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl p-4 z-50 min-w-[280px]">
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">From Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                      // ✅ Auto close after selecting both dates
                      if (dateRange.endDate && e.target.value) {
                        setTimeout(() => setShowDatePicker(false), 300);
                      }
                    }}
                    max={dateRange.endDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">To Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                      // ✅ Auto close after selecting both dates
                      if (dateRange.startDate && e.target.value) {
                        setTimeout(() => setShowDatePicker(false), 300);
                      }
                    }}
                    min={dateRange.startDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>

                {/* ✅ Quick Filter Buttons - Auto Close */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today);
                      weekAgo.setDate(today.getDate() - 7);
                      setDateRange({
                        startDate: weekAgo.toISOString().split('T')[0],
                        endDate: today.toISOString().split('T')[0]
                      });
                      setShowDatePicker(false); // ✅ Auto close
                    }}
                    className="flex-1 px-3 py-1.5 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 rounded-lg text-xs font-medium transition-all border border-violet-500/30"
                  >
                    Last 7 Days
                  </button>
                  
                  <button
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today);
                      monthAgo.setMonth(today.getMonth() - 1);
                      setDateRange({
                        startDate: monthAgo.toISOString().split('T')[0],
                        endDate: today.toISOString().split('T')[0]
                      });
                      setShowDatePicker(false); // ✅ Auto close
                    }}
                    className="flex-1 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-xs font-medium transition-all border border-cyan-500/30"
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      
      </div>
        {/* Post Filter Dropdown */}
        <div className="relative flex-1 min-w-[300px] lg:flex-initial lg:flex-1" ref={dropdownRef}>
          <div className="relative  ">
            <input
              type="text"
              value={showPostDropdown ? postSearchTerm : getSelectedPostTitle()}
              onChange={(e) => {
                setPostSearchTerm(e.target.value);
                if (!showPostDropdown) setShowPostDropdown(true);
              }}
              onFocus={() => {
                setShowPostDropdown(true);
                setPostSearchTerm("");
              }}
              placeholder={loadingPosts ? "Loading posts..." : "Filter by post..."}
              disabled={loadingPosts || blogPosts.length === 0 || loadingComments}
              className={`w-full px-3.5 py-2 pl-10 pr-10 bg-slate-800/50 border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${
                postFilter !== "all" 
                  ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/50  " 
                  : "border-slate-600 hover:border-slate-500"
              } ${loadingPosts || blogPosts.length === 0 || loadingComments ? "opacity-50 cursor-not-allowed" : ""}`}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            
            {postFilter !== "all" ? (
              <button
                onClick={() => {
                  setPostFilter("all");
                  setPostSearchTerm("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-red-700 rounded transition-all"
              >
                <X className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
              </button>
            ) : (
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none transition-transform ${showPostDropdown ? "rotate-180" : ""}`} />
            )}
          </div>

          {/* Post Dropdown List */}
          {showPostDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50">
              <button
                onClick={() => {
                  setPostFilter("all");
                  setShowPostDropdown(false);
                  setPostSearchTerm("");
                }}
                className={`w-full px-4 py-2.5 text-left hover:bg-slate-700 transition-all ${
                  postFilter === "all" ? "bg-purple-500/10 text-purple-400" : "text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">All Posts</span>
                </div>
              </button>

              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => {
                      setPostFilter(post.id);
                      setShowPostDropdown(false);
                      setPostSearchTerm("");
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-700 transition-all border-t border-slate-700 ${
                      postFilter === post.id ? "bg-purple-500/10 text-purple-400" : "text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <span className="text-sm truncate">{post.title}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-slate-500 text-sm">
                  No posts found for "{postSearchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    

  
         {hasActiveFilters && (
        <div className="flex items-center gap-2">
         
          <button
            onClick={clearFilters}
            className="px-2.5 py-2 bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-[11px] font-medium flex items-center gap-1.5"
          >
            <FilterX className="h-3.5 w-3.5" />
            Clear All
          </button>
        </div>
      )}
    </div>

  {/* Comments List */}
  {loadingComments ? (
    <div className="text-center py-12">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-400">Loading comments...</p>
    </div>
  ) : currentData.length === 0 ? (
    <div className="text-center py-12">
      <MessageSquare className="h-16 w-16 text-slate-600 mx-auto mb-4" />
      <p className="text-slate-400 text-lg mb-2">
        {comments.length === 0 ? "No comments yet" : "No comments found"}
      </p>
      <p className="text-slate-500 text-sm">
        {comments.length === 0
          ? postFilter === "all"
            ? "Comments will appear here when users interact with your posts"
            : "This post has no comments yet"
          : "Try adjusting your search or filters"}
      </p>
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all text-sm font-medium"
        >
          Clear Filters
        </button>
      )}
    </div>
  ) : (
    <div className="space-y-2.5">
      {currentData.map((parentComment) => {
        const replies = getReplies(parentComment.id);
        
        return (
          <div
            key={`parent-${parentComment.id}`}
            className={`border rounded-xl px-3 py-3 transition-all ${
              parentComment.isDeleted
                ? 'bg-slate-800/20 border-slate-700/50 opacity-60'
                : parentComment.isSpam
                ? 'bg-red-500/5 border-red-500/30 hover:border-red-500/50'
                : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                parentComment.isDeleted ? 'bg-slate-600' : parentComment.isSpam ? 'bg-gradient-to-br from-red-500 to-rose-500' : 'bg-gradient-to-br from-violet-500 to-cyan-500'
              }`}>
                <span className="text-white text-sm font-bold">
                  {parentComment.isDeleted ? '🗑' : parentComment.isSpam ? '⚠' : parentComment.authorName?.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Content Section */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold ${parentComment.isDeleted ? 'text-slate-500' : 'text-white'}`}>
                      {parentComment.authorName}
                    </p>
                    
                    {isAdminComment(parentComment) && !parentComment.isDeleted && (
                      <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 rounded text-[10px] font-medium border border-violet-500/30">Admin</span>
                    )}
                    
                    <span className="text-slate-600">•</span>
                    
                    <p className="text-slate-400 text-[11px]">
                        {formatDate(parentComment.createdAt)}
                    </p>
                        {/* Status Badge */}
                    <span className={`inline-flex w-fit px-2.5 py-1 rounded-lg text-[11px] font-semibold border items-center gap-1.5 whitespace-nowrap ${
                      parentComment.isDeleted ? 'bg-slate-700/50 text-slate-400 border-slate-600/50' : 
                      parentComment.isSpam ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                      parentComment.isApproved ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {parentComment.isDeleted ? <><Trash2 className="h-3 w-3" />Deleted</> : 
                       parentComment.isSpam ? <><Shield className="h-3 w-3" />Spam</> : 
                       parentComment.isApproved ? <><CheckCircle className="h-3 w-3" />Approved</> : 
                       <><Clock className="h-3 w-3" />Pending</>}
                    </span>
                    </div>

                    {/* Post Title */}
              {/* Post Title */}
{!parentComment.isDeleted && (
  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
    <span className="text-slate-500">Commented on</span>

    <a
      href={`/blog/${parentComment.blogSlug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 hover:underline font-medium break-words transition-all"
      title="View blog post"
    >
      {parentComment.blogPostTitle || "Unknown Post"}
    </a>
  </div>
)}

                
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 lg:justify-end flex-shrink-0">
                    {parentComment.isDeleted ? (
                      <button onClick={() => handleUndelete(parentComment.id)} disabled={actionLoading === parentComment.id} className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border border-emerald-500/30 disabled:opacity-50">
                        {actionLoading === parentComment.id ? <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        Restore
                      </button>
                    ) : parentComment.isSpam ? (
                      <>
                        <button onClick={() => handleUnflagSpam(parentComment.id)} disabled={actionLoading === parentComment.id} className="px-2.5 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border border-blue-500/30 disabled:opacity-50">
                          <ShieldOff className="h-3.5 w-3.5" />Restore
                        </button>
                        <button onClick={() => setViewingComment(parentComment)} className="px-2.5 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border border-cyan-500/30">
                          <Eye className="h-3.5 w-3.5" />View
                        </button>
                        <button onClick={() => setDeleteConfirm({ id: parentComment.id, author: parentComment.authorName })} className="px-2.5 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border border-red-500/30">
                          <Trash2 className="h-3.5 w-3.5" />Delete
                        </button>
                      </>
                    ) : (
                      <>
                        {!parentComment.isApproved && (
                          <button onClick={() => handleApprove(parentComment.id)} disabled={actionLoading === parentComment.id} className="px-2.5 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border border-green-500/30 disabled:opacity-50">
                            <CheckCircle className="h-3.5 w-3.5" />Approve
                          </button>
                        )}
                        {!isAdminComment(parentComment) && (
                          <button onClick={() => openSpamFlagModal(parentComment)} disabled={actionLoading === parentComment.id} className="px-2.5 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border border-red-500/30 disabled:opacity-50">
                            <Shield className="h-3.5 w-3.5" />Spam
                          </button>
                        )}
   {parentComment.isApproved && (
  <button
    onClick={() => setReplyingTo(parentComment)}
    className="px-2.5 py-1.5 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border border-violet-500/30"
  >
    <Reply className="h-3.5 w-3.5" />
    Reply
  </button>
)}
                        <button onClick={() => setViewingComment(parentComment)} className="px-2.5 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border border-cyan-500/30">
                          <Eye className="h-3.5 w-3.5" />View
                        </button>
                        <button onClick={() => setDeleteConfirm({ id: parentComment.id, author: parentComment.authorName })} className="px-2.5 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border border-red-500/30">
                          <Trash2 className="h-3.5 w-3.5" />Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Comment Text */}
                <div className={`text-sm leading-6 ${parentComment.isDeleted ? 'text-slate-600 italic' : parentComment.isSpam ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  {parentComment.isDeleted ? '[This comment has been deleted]' : <><span className="text-violet-400 font-semibold">Comment:</span> {parentComment.commentText}</>}
                </div>
              </div>
            </div>

            {/* Replies Section */}
            {replies.length > 0 && !parentComment.isDeleted && (
              <div className="mt-3 ml-5 space-y-2 border-l border-slate-700/50 pl-3 sm:ml-12">
                <div className="flex items-center gap-1.5">
                  <CornerDownRight className="h-3.5 w-3.5 text-slate-500" />
                  <p className="text-slate-400 text-[11px] font-medium">{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</p>
                </div>

                {replies.map((reply) => (
                  <div key={`reply-${reply.id}`} className={`border rounded-lg px-3 py-2.5 transition-all ${reply.isDeleted ? 'bg-slate-800/10 border-slate-700/30 opacity-60' : reply.isSpam ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-800/40 border-slate-700/40'}`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${reply.isDeleted ? 'bg-slate-600' : reply.isSpam ? 'bg-gradient-to-br from-red-500 to-rose-500' : 'bg-gradient-to-br from-cyan-500 to-blue-500'}`}>
                        <span className="text-white text-xs font-bold">
                          {reply.isDeleted ? '🗑' : reply.isSpam ? '⚠' : reply.authorName?.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-medium text-sm ${reply.isDeleted ? 'text-slate-500' : 'text-white'}`}>{reply.authorName}</p>
                            {isAdminComment(reply) && !reply.isDeleted && <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 rounded text-[10px] font-medium">Admin</span>}
                            <span className="text-slate-600 text-xs">•</span>
                             {formatDate(reply.createdAt)}
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium items-center gap-1 ${reply.isDeleted ? 'bg-slate-700/50 text-slate-500' : reply.isSpam ? 'bg-red-500/10 text-red-400' : reply.isApproved ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {reply.isDeleted ? <><Trash2 className="h-2.5 w-2.5" />Deleted</> : reply.isSpam ? 'Spam' : reply.isApproved ? 'Approved' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 sm:justify-end flex-shrink-0">
                            {reply.isDeleted ? (
                              <button onClick={() => handleUndelete(reply.id)} disabled={actionLoading === reply.id} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded text-[11px] font-medium transition-all flex items-center gap-1 border border-emerald-500/30 disabled:opacity-50">
                                <RefreshCw className="h-3 w-3" />Restore
                              </button>
                            ) : (
                              <>
                                {!reply.isApproved && !reply.isSpam && (
                                  <button onClick={() => handleApprove(reply.id)} disabled={actionLoading === reply.id} className="px-2 py-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded text-[11px] font-medium transition-all flex items-center gap-1 border border-green-500/30 disabled:opacity-50">
                                    <CheckCircle className="h-3 w-3" />Approve
                                  </button>
                                )}
                                {!isAdminComment(reply) && !reply.isSpam && (
                                  <button onClick={() => openSpamFlagModal(reply)} disabled={actionLoading === reply.id} className="px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded text-[11px] font-medium transition-all flex items-center gap-1 border border-red-500/30 disabled:opacity-50">
                                    <Shield className="h-3 w-3" />Spam
                                  </button>
                                )}
                                {reply.isSpam && (
                                  <button onClick={() => handleUnflagSpam(reply.id)} disabled={actionLoading === reply.id} className="px-2 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded text-[11px] font-medium transition-all flex items-center gap-1 border border-blue-500/30 disabled:opacity-50">
                                    <ShieldOff className="h-3 w-3" />Restore
                                  </button>
                                )}
                                <button onClick={() => setViewingComment(reply)} className="px-2 py-1 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 rounded text-[11px] font-medium transition-all flex items-center gap-1 border border-violet-500/30">
                                  <Eye className="h-3 w-3" />View
                                </button>
                                <button onClick={() => setDeleteConfirm({ id: reply.id, author: reply.authorName })} className="px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded text-[11px] font-medium transition-all flex items-center gap-1 border border-red-500/30">
                                  <Trash2 className="h-3 w-3" />Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <p className={`mt-1 text-xs leading-5 ${reply.isDeleted ? 'text-slate-600 italic' : reply.isSpam ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                          {reply.isDeleted ? '[This reply has been deleted]' : reply.commentText}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}
</div>




        {/* Pagination */}
        {totalPages > 1 && !loadingComments && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 text-sm rounded-lg transition-all ${
                        currentPage === page
                          ? 'bg-violet-500 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="text-sm text-slate-400">
                Total: {totalItems} comments
              </div>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {replyingTo && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-blue-500/20 rounded-3xl max-w-2xl w-full shadow-2xl shadow-blue-500/10">
              <div className="p-6 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Reply to Comment</h2>
                    <p className="text-slate-400 text-sm mt-1">Replying to {replyingTo.authorName}</p>
                  </div>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                    className="p-2 text-slate-400 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-sm mb-2">Original Comment</p>
                  <p className="text-white">{replyingTo.commentText}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your Reply
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50">
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || actionLoading === replyingTo.id}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg  hover:shadow-blue-500/50 transition-all font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === replyingTo.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Reply className="h-4 w-4" />
                      Post Reply
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Comment Modal */}
        {viewingComment && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-violet-500/20 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-violet-500/10">
              <div className="p-6 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
                      Comment Details
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">View comment information</p>
                  </div>
                  <button
                    onClick={() => setViewingComment(null)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-4">
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {viewingComment.authorName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{viewingComment.authorName}</p>
                        <p className="text-slate-400 text-sm">{viewingComment.authorEmail}</p>
                      </div>
                      <span className={`ml-auto px-3 py-1 rounded-lg text-xs font-medium ${
                        viewingComment.isSpam 
                          ? 'bg-red-500/10 text-red-400' 
                          : viewingComment.isApproved 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {viewingComment.isSpam ? 'Spam' : viewingComment.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Comment</p>
                        <p className="text-white">{viewingComment.commentText}</p>
                      </div>

                      <div>
                        <p className="text-slate-400 text-sm mb-1">Post</p>
                        <button
                          onClick={() => {
                            setPostFilter(viewingComment.blogPostId);
                            setViewingComment(null);
                          }}
                          className="text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {viewingComment.blogPostTitle || 'Unknown Post'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Date</p>
                          <p className="text-white text-sm">
                              {formatDate(viewingComment.createdAt)}
                          </p>
                        </div>

                        {viewingComment.approvedAt && (
                          <div>
                            <p className="text-slate-400 text-sm mb-1">Approved At</p>
                            <p className="text-white text-sm">
                                {formatDate(viewingComment.approvedAt)}
                            </p>
                          </div>
                        )}
                      </div>

                      {viewingComment.isSpam && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                          <p className="text-red-400 text-sm font-medium mb-1">Spam Information</p>
                          <p className="text-slate-300 text-sm">
                            Reason: {viewingComment.spamReason || 'Flagged by admin'}
                          </p>
                          {viewingComment.flaggedAt && (
                            <p className="text-slate-400 text-xs mt-1">
                              Flagged at: {new Date(viewingComment.flaggedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50 p-6">
                {!viewingComment.isApproved && !viewingComment.isSpam && (
                  <button
                    onClick={() => {
                      handleApprove(viewingComment.id);
                      setViewingComment(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm"
                  >
                    Approve Comment
                  </button>
                )}

                {viewingComment.isSpam && (
                  <button
                    onClick={() => {
                      handleUnflagSpam(viewingComment.id);
                      setViewingComment(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                  >
                    Restore from Spam
                  </button>
                )}

                <button
                  onClick={() => setViewingComment(null)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-medium text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Spam Flag Modal */}
        {spamFlagModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-red-500/20 rounded-3xl max-w-2xl w-full my-8 shadow-2xl shadow-red-500/10 max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-red-500/20 bg-gradient-to-r from-red-500/10 to-rose-500/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Shield className="h-6 w-6 text-red-400" />
                      Flag as Spam
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Report this comment as spam
                    </p>
                  </div>
                  <button
                    onClick={() => setSpamFlagModal(null)}
                    disabled={isSubmittingSpam}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-sm mb-2">Comment to Flag</p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {spamFlagModal.comment.authorName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">
                        {spamFlagModal.comment.authorName}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {spamFlagModal.comment.authorEmail}
                      </p>
                      <p className="text-slate-300 text-sm mt-2 break-words">
                        {spamFlagModal.comment.commentText}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Reason for Flagging <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={spamFlagModal.reason}
                    onChange={(e) => setSpamFlagModal({ 
                      ...spamFlagModal, 
                      reason: e.target.value 
                    })}
                    placeholder="e.g., Contains inappropriate content, promotional spam, etc."
                    rows={3}
                    disabled={isSubmittingSpam}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Provide a clear reason for flagging this comment
                  </p>
                </div>

              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Spam Score <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={spamFlagModal.spamScore}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setSpamFlagModal({ 
                        ...spamFlagModal, 
                        spamScore: Math.max(1, Math.min(10, value)) 
                      });
                    }}
                    disabled={isSubmittingSpam}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-slate-500 text-xs">
                      Severity level (1-10)
                    </p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <div
                          key={score}
                          className={`h-2 w-2 rounded-full transition-colors ${
                            score <= spamFlagModal.spamScore
                              ? score <= 3
                                ? 'bg-yellow-400'
                                : score <= 6
                                ? 'bg-orange-400'
                                : 'bg-red-400'
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

     <div>
  <label className="block text-sm font-medium text-slate-300 mb-2">
    Flagged By <span className="text-red-400">*</span>
  </label>

  <input
    type="text"
    value={spamFlagModal.flaggedBy || ""}
    readOnly
    disabled={isSubmittingSpam}
    className="w-full px-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl text-white placeholder-slate-500 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:opacity-50"
  />

  <p className="text-slate-500 text-xs mt-1">
    Name is auto-filled from your profile (Not editable)
  </p>
</div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-sm font-semibold">Warning</p>
                    <p className="text-slate-400 text-xs mt-1">
                      This action will mark the comment as spam and hide it from public view.
                      The comment can be restored later if needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50 flex-shrink-0 bg-slate-900/50">
                <button
                  onClick={() => setSpamFlagModal(null)}
                  disabled={isSubmittingSpam}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-medium text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSpamFlag}
                  disabled={
                    isSubmittingSpam || 
                    !spamFlagModal.reason.trim() || 
                    !spamFlagModal.flaggedBy.trim()
                  }
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmittingSpam ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Flagging...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Flag as Spam
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
          title="Delete Comment"
          message={`Are you sure you want to delete the comment by "${deleteConfirm?.author}"? This action cannot be undone.`}
          confirmText="Delete Comment"
          cancelText="Cancel"
          icon={Trash2}
          iconColor="text-red-400"
          confirmButtonStyle="bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/50"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
