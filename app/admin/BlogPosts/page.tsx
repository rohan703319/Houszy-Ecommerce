"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Edit, Trash2, Search, FileText, Eye, FilterX,
  Star, MessageSquare, RotateCcw, FolderTree, ChevronLeft,
  ChevronRight, TrendingUp, BookOpen, Users, BarChart2,
  CheckCircle, Clock, X,
} from "lucide-react";

import { BlogPost, blogPostsService, BlogCategory } from "@/lib/services/blogPosts";
import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import { getImageUrl } from "../_utils/formatUtils";



const getAllComments = (comments: any[]): any[] => {
  let all: any[] = [];
  comments?.forEach((c) => {
    all.push(c);
    if (c.replies?.length) all = all.concat(getAllComments(c.replies));
  });
  return all;
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function BlogPostsPage() {
  const router = useRouter();
  const toast = useToast();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [showFilter, setShowFilter] = useState("active");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const [confirm, setConfirm] = useState<{ id: string; title: string; action: "delete" | "restore" } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────
  const load = async () => {
    try {
      const [postsRes, catsRes] = await Promise.all([
        blogPostsService.getAll(true, false, true),
        blogPostsService.getAllCategories?.() ?? Promise.resolve({ data: { data: [] } }),
      ]);
      if (postsRes.data?.success) setPosts(postsRes.data.data ?? []);
      const cData = catsRes?.data?.data ?? catsRes?.data ?? [];
      setCategories(Array.isArray(cData) ? cData : []);
    } catch {
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter, catFilter, showFilter]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = posts.filter((p) => !p.isDeleted);
    const published = active.filter((p) => p.isPublished).length;
    const drafts = active.filter((p) => !p.isPublished).length;
    const featured = active.filter((p) => p.showOnHomePage).length;
    const deleted = posts.filter((p) => p.isDeleted).length;
    const totalViews = active.reduce((s, p) => s + (p.viewCount || 0), 0);
    let totalComments = 0, pending = 0;
    active.forEach((p) => {
      const all = getAllComments(p.comments ?? []);
      totalComments += all.length;
      pending += all.filter((c) => !c.isApproved && !c.isSpam).length;
    });
    return { total: active.length, published, drafts, featured, deleted, totalViews, totalComments, pending };
  }, [posts]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.title?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q) || p.bodyOverview?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || (statusFilter === "published" && p.isPublished) || (statusFilter === "draft" && !p.isPublished);
      const matchCat = catFilter === "all" || p.blogCategoryId === catFilter;
      const matchDel = showFilter === "all" || (showFilter === "active" && !p.isDeleted) || (showFilter === "deleted" && p.isDeleted);
      return matchSearch && matchStatus && matchCat && matchDel;
    });
  }, [posts, search, statusFilter, catFilter, showFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasFilters = search || statusFilter !== "all" || catFilter !== "all" || showFilter !== "active";

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setProcessing(true);
    try {
      const r = await blogPostsService.delete(id);
      if (r.data?.success) { toast.success("Deleted!"); await load(); }
      else throw new Error(r.data?.message);
    } catch (e: any) { toast.error(e.message || "Delete failed"); }
    finally { setProcessing(false); setConfirm(null); }
  };

  const handleRestore = async (id: string) => {
    setProcessing(true);
    try {
      const r = await blogPostsService.restore(id);
      if (r.data?.success) { toast.success("Restored!"); await load(); }
      else throw new Error(r.data?.message);
    } catch (e: any) { toast.error(e.message || "Restore failed"); }
    finally { setProcessing(false); setConfirm(null); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
            Blog Posts
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">{stats.total} posts · {stats.published} published · {stats.drafts} drafts</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => router.push("/admin/comments")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/15 border border-pink-500/30 text-pink-400 hover:bg-pink-500/25 text-xs font-semibold rounded-lg transition-all">
            <MessageSquare className="w-3.5 h-3.5" />Go to Blog Comment Page
          </button>
          <button onClick={() => router.push("/admin/BlogCategories")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/15 border border-violet-500/30 text-violet-400 hover:bg-violet-500/25 text-xs font-semibold rounded-lg transition-all">
            <FolderTree className="w-3.5 h-3.5" />Go to Blog Category Page
          </button>
          <button onClick={() => router.push("/admin/BlogPosts/create")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all">
            <Plus className="w-3.5 h-3.5" /> New Post
          </button>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Published */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-2 hover:border-violet-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Published</span>
            <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
              <FileText className="w-3 h-3 text-violet-400" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-extrabold text-white leading-none">{stats.published}</span>
            <div className="text-right">
              <p className="text-[10px] text-amber-400 font-semibold leading-none">{stats.drafts}</p>
              <p className="text-[9px] text-slate-500 leading-none mt-0.5">drafts</p>
            </div>
          </div>
          <div className="w-full h-1 rounded-full bg-slate-700/60 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-700"
              style={{ width: stats.total ? `${(stats.published / stats.total) * 100}%` : "0%" }} />
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-2 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Total Views</span>
            <div className="w-6 h-6 rounded-md bg-cyan-500/20 flex items-center justify-center">
              <Eye className="w-3 h-3 text-cyan-400" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-extrabold text-white leading-none">{stats.totalViews}</span>
            <div className="text-right">
              <p className="text-[10px] text-cyan-400 font-semibold leading-none">{stats.total}</p>
              <p className="text-[9px] text-slate-500 leading-none mt-0.5">posts</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-cyan-500" />
            <span className="text-[10px] text-slate-500">
              {stats.total ? Math.round(stats.totalViews / stats.total) : 0} avg/post
            </span>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-2 hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Comments</span>
            <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-blue-400" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-extrabold text-white leading-none">{stats.totalComments}</span>
            <div className="text-right">
              <p className={`text-[10px] font-semibold leading-none ${stats.pending > 0 ? "text-amber-400" : "text-slate-500"}`}>{stats.pending}</p>
              <p className="text-[9px] text-slate-500 leading-none mt-0.5">pending</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {stats.pending > 0
              ? <span className="flex items-center gap-1 text-[10px] text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Needs review</span>
              : <span className="flex items-center gap-1 text-[10px] text-green-400"><CheckCircle className="w-3 h-3" />All clear</span>
            }
          </div>
        </div>

        {/* Featured */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-2 hover:border-pink-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Featured</span>
            <div className="w-6 h-6 rounded-md bg-pink-500/20 flex items-center justify-center">
              <Star className="w-3 h-3 text-pink-400" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-extrabold text-white leading-none">{stats.featured}</span>
            <div className="text-right">
              <p className={`text-[10px] font-semibold leading-none ${stats.deleted > 0 ? "text-red-400" : "text-slate-500"}`}>{stats.deleted}</p>
              <p className="text-[9px] text-slate-500 leading-none mt-0.5">deleted</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500">homepage</span>
            <div className="flex-1 h-1 rounded-full bg-slate-700/60 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-700"
                style={{ width: stats.total ? `${(stats.featured / stats.total) * 100}%` : "0%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-700/50 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status */}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-2.5 py-1.5 border rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all ${statusFilter !== "all" ? "bg-violet-500/15 border-violet-500/40 text-violet-300" : "bg-slate-700/50 border-slate-700"}`}>
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        {/* Category */}
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className={`px-2.5 py-1.5 border rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all ${catFilter !== "all" ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300" : "bg-slate-700/50 border-slate-700"}`}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Deleted toggle */}
        <select value={showFilter} onChange={(e) => setShowFilter(e.target.value)}
          className={`px-2.5 py-1.5 border rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all ${showFilter !== "active" ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-slate-700/50 border-slate-700"}`}>
          <option value="active">Active Only</option>
          <option value="all">Show All</option>
          <option value="deleted">Deleted Only</option>
        </select>

        {hasFilters && (
          <button onClick={() => { setSearch(""); setStatusFilter("all"); setCatFilter("all"); setShowFilter("active"); }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 text-xs transition-all">
            <FilterX className="w-3 h-3" /> Clear
          </button>
        )}

        <span className="ml-auto text-[10px] text-slate-500 whitespace-nowrap">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        {pageData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="w-10 h-10 text-slate-600" />
            <p className="text-slate-400 text-sm">{posts.length === 0 ? "No blog posts yet" : "No posts match your filters"}</p>
            {posts.length === 0 && (
              <button onClick={() => router.push("/admin/BlogPosts/create")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-xs font-semibold rounded-lg">
                <Plus className="w-3.5 h-3.5" /> Create First Post
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table Head */}
            <div className="grid grid-cols-[2fr_1fr_80px_64px_64px_100px_110px_88px] items-center gap-2 px-4 py-2 border-b border-slate-700/50 bg-slate-800/60">
              {["Post", "Category", "Status", "Views", "Comments", "Author", "Published", "Actions"].map((h) => (
                <span key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-700/30">
              {pageData.map((post) => {
                const commentCount = getAllComments(post.comments ?? []).length;
                const thumb = getImageUrl(post.featuredImageUrl || post.thumbnailImageUrl);
                return (
                  <div
                    key={post.id}
                    className={`grid grid-cols-[2fr_1fr_80px_64px_64px_100px_110px_88px] items-center gap-2 px-4 py-2.5 hover:bg-slate-700/20 transition-colors ${post.isDeleted ? "opacity-50" : ""}`}
                  >
                    {/* Post title + slug */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0 cursor-pointer hover:ring-1 hover:ring-violet-500"
                          onClick={() => setPreviewImg(thumb)}
                       onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/30 to-pink-500/30 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5 text-violet-400" />
                        </div>
                      )}
                    <div className="min-w-0">
  {!post.isDeleted ? (
    <a
      href={`/blog/${post.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-white text-xs font-semibold truncate cursor-pointer hover:text-violet-400 transition-colors"
      title={post.title}
    >
      {post.title}
      {post.showOnHomePage && (
        <span className="ml-1.5 text-[9px] text-pink-400">★</span>
      )}
    </a>
  ) : (
    <p
      className="text-white text-xs font-semibold truncate cursor-not-allowed opacity-60"
      title={post.title}
    >
      {post.title}
      <span className="ml-1.5 text-[9px] text-orange-400 font-normal">
        (Deleted)
      </span>
      {post.showOnHomePage && (
        <span className="ml-1.5 text-[9px] text-pink-400">★</span>
      )}
    </p>
  )}

  <p className="text-[10px] text-slate-500 truncate font-mono">
    {post.slug}
  </p>
</div>
                    </div>

                    {/* Category */}
                    <span className="text-xs text-slate-400 truncate">{post.blogCategoryName || <span className="text-slate-600">—</span>}</span>

                    {/* Status */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${post.isPublished ? "bg-green-500/15 border border-green-500/30 text-green-400" : "bg-amber-500/15 border border-amber-500/30 text-amber-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${post.isPublished ? "bg-green-400" : "bg-amber-400"}`} />
                      {post.isPublished ? "Live" : "Draft"}
                    </span>

                    {/* Views */}
                    <span className="text-xs text-cyan-400 font-semibold text-center">{post.viewCount ?? 0}</span>

                    {/* Comments */}
                    <span className="text-xs text-blue-400 font-semibold text-center">{commentCount}</span>

                    {/* Author */}
                    <span className="text-xs text-slate-400 truncate">{post.authorName || "Unknown"}</span>

                    {/* Published date */}
                    <span className="text-[10px] text-slate-500">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : <span className="text-slate-600">Not set</span>}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5">
                      {!post.isDeleted ? (
                        <>
                          <a
  href={`/blog/${post.slug}`}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
  title="View"
>
  <Eye className="w-3.5 h-3.5" />
</a>
                          <button
                            onClick={() => router.push(`/admin/BlogPosts/edit/${post.id}`)}
                            className="p-1.5 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirm({ id: post.id, title: post.title, action: "delete" })}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirm({ id: post.id, title: post.title, action: "restore" })}
                          className="flex items-center gap-1 px-2 py-1 text-green-400 hover:bg-green-500/10 border border-green-500/20 rounded-lg text-[10px] font-medium transition-all">
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-slate-500">
            Page {page} of {totalPages} · {filtered.length} posts
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 text-xs rounded-lg transition-all ${p === page ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-semibold" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Image Preview ───────────────────────────────────────────────── */}
      {previewImg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-2xl">
            <img src={previewImg} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" onError={(e) => (e.currentTarget.src = "/placeholder.png")}/>
            <button onClick={() => setPreviewImg(null)} className="absolute top-3 right-3 p-1.5 bg-slate-900/80 text-white rounded-lg hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ──────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.action === "delete" ? handleDelete(confirm.id) : handleRestore(confirm!.id)}
        title={confirm?.action === "delete" ? "Delete Post" : "Restore Post"}
        message={confirm?.action === "delete"
          ? `Delete "${confirm?.title}"? You can restore it later.`
          : `Restore "${confirm?.title}"?`}
        confirmText={confirm?.action === "delete" ? "Delete" : "Restore"}
        cancelText="Cancel"
        icon={confirm?.action === "delete" ? Trash2 : RotateCcw}
        iconColor={confirm?.action === "delete" ? "text-red-400" : "text-green-400"}
        confirmButtonStyle={confirm?.action === "delete"
          ? "bg-gradient-to-r from-red-500 to-rose-500"
          : "bg-gradient-to-r from-green-500 to-emerald-500"}
        isLoading={processing}
      />
    </div>
  );
}
