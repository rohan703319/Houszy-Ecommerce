"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Send, X, Plus, ImagePlus,
  Tag, Globe, Hash, FileText, Settings, Loader2,
  AlertCircle, CheckCircle, ChevronDown, ChevronUp, Calendar,
  AlignLeft, BookOpen, Image as ImageIcon, TrendingUp, Link2,
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";
import { useToast } from "@/app/admin/_components/CustomToast";
import { blogPostsService, BlogPost, BlogCategory } from "@/lib/services/blogPosts";
import { ProductDescriptionEditor } from "@/app/admin/_components/SelfHostedEditor";
import { blogCategoriesService } from "@/lib/services/blogCategories";
import { generateSlug } from "../_utils/formatUtils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormErrors {
  title?: string;
  slug?: string;
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface BlogPostFormProps {
  mode: "create" | "edit";
  initialData?: BlogPost | null;
}



const inp =
  "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors";

const label = "block text-xs font-medium text-slate-400 mb-1";

function SectionCard({
  title,
  icon,
  children,
  collapsible = false,
  defaultOpen = true,
  overflowVisible = false,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  overflowVisible?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl ${overflowVisible ? "overflow-visible" : "overflow-hidden"} ${className}`}>
      <button
        type="button"
        onClick={() => collapsible && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50 ${collapsible ? "cursor-pointer hover:bg-slate-700/20" : "cursor-default"}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-violet-400">{icon}</span>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{title}</span>
        </div>
        {collapsible && (
          <span className="text-slate-500">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        )}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function CharCounter({ value, max, warn = 0.85 }: { value: string; max: number; warn?: number }) {
  const len = value.length;
  const pct = len / max;
  const color = len > max ? "text-red-400" : pct >= warn ? "text-amber-400" : "text-slate-500";
  return (
    <span className={`text-[10px] ${color} ml-auto`}>
      {len}/{max}
    </span>
  );
}

// ─── SEO Score Logic ──────────────────────────────────────────────────────────
interface SeoCheck {
  key: string;
  label: string;
  description: string;
  points: number;
  status: "pass" | "fail" | "warn";
}

function computeSeo(
  title: string,
  slug: string,
  body: string,
  summary: string,
  metaTitle: string,
  metaDescription: string,
  metaKeywords: string,
  thumbnailUrl: string,
  tags: string[],
  blogCategoryId: string,
): { score: number; checks: SeoCheck[] } {
  const plainBody = body.replace(/<[^>]+>/g, "").trim();
  const wordCount = plainBody ? plainBody.split(/\s+/).length : 0;
  const titleLen = title.trim().length;

  const checks: SeoCheck[] = [
    {
      key: "title",
      label: "Title",
      description: title.trim() ? `${titleLen} characters` : "Add a post title",
      points: 15,
      status: !title.trim() ? "fail" : titleLen < 20 ? "warn" : "pass",
    },
    {
      key: "titleLen",
      label: "Title Length (50–70 chars)",
      description:
        titleLen >= 50 && titleLen <= 70
          ? "Perfect length for SEO"
          : titleLen > 0 && titleLen < 50
          ? `Too short (${titleLen}/50–70)`
          : titleLen > 70
          ? `Too long (${titleLen}/70)`
          : "Enter a title first",
      points: 10,
      status: titleLen >= 50 && titleLen <= 70 ? "pass" : titleLen >= 30 && titleLen < 50 ? "warn" : "fail",
    },
    {
      key: "slug",
      label: "URL Slug",
      description: slug.trim() ? `/${slug}` : "Slug is missing",
      points: 10,
      status: slug.trim() ? "pass" : "fail",
    },
    {
      key: "body",
      label: "Content",
      description:
        wordCount >= 300
          ? `${wordCount} words — great!`
          : wordCount > 0
          ? `${wordCount} words (aim for 300+)`
          : "Add post content",
      points: 15,
      status: wordCount >= 300 ? "pass" : wordCount >= 100 ? "warn" : "fail",
    },
    {
      key: "summary",
      label: "Excerpt / Summary",
      description: summary.trim() ? `${summary.trim().length} characters` : "Add a post excerpt",
      points: 10,
      status: summary.trim().length >= 50 ? "pass" : summary.trim().length > 0 ? "warn" : "fail",
    },
    {
      key: "thumbnail",
      label: "Featured Image",
      description: thumbnailUrl ? "Thumbnail uploaded" : "Upload a thumbnail image",
      points: 5,
      status: thumbnailUrl ? "pass" : "fail",
    },
    {
      key: "category",
      label: "Category",
      description: blogCategoryId ? "Category assigned" : "Select a category",
      points: 5,
      status: blogCategoryId ? "pass" : "fail",
    },
    {
      key: "tags",
      label: "Tags",
      description: tags.length > 0 ? `${tags.length} tag${tags.length > 1 ? "s" : ""}` : "Add relevant tags",
      points: 5,
      status: tags.length >= 2 ? "pass" : tags.length === 1 ? "warn" : "fail",
    },
    {
      key: "metaTitle",
      label: "Meta Title",
      description:
        metaTitle.trim()
          ? metaTitle.length > 60
            ? `Too long (${metaTitle.length}/60)`
            : `${metaTitle.length} chars`
          : "Add meta title for SEO",
      points: 10,
      status: metaTitle.trim() && metaTitle.length <= 60 ? "pass" : metaTitle.trim() ? "warn" : "fail",
    },
    {
      key: "metaDesc",
      label: "Meta Description",
      description:
        metaDescription.trim()
          ? metaDescription.length > 160
            ? `Too long (${metaDescription.length}/160)`
            : `${metaDescription.length} chars`
          : "Add meta description",
      points: 10,
      status: metaDescription.trim() && metaDescription.length <= 160 ? "pass" : metaDescription.trim() ? "warn" : "fail",
    },
    {
      key: "keywords",
      label: "Meta Keywords",
      description: metaKeywords.trim() ? "Keywords added" : "Add meta keywords",
      points: 5,
      status: metaKeywords.trim() ? "pass" : "fail",
    },
  ];

  const score = checks.reduce((sum, c) => {
    if (c.status === "pass") return sum + c.points;
    if (c.status === "warn") return sum + Math.round(c.points * 0.5);
    return sum;
  }, 0);

  return { score: Math.min(score, 100), checks };
}

function SeoScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const grade =
    score >= 80 ? { label: "Excellent", color: "#22c55e", ring: "#22c55e" } :
    score >= 60 ? { label: "Good",      color: "#84cc16", ring: "#84cc16" } :
    score >= 35 ? { label: "Fair",      color: "#f59e0b", ring: "#f59e0b" } :
                  { label: "Poor",      color: "#ef4444", ring: "#ef4444" };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="7" />
          {/* Progress */}
          <circle
            cx="40" cy="40" r={r}
            fill="none"
            stroke={grade.ring}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-white leading-none">{score}</span>
          <span className="text-[9px] text-slate-400 leading-none mt-0.5">/ 100</span>
        </div>
      </div>
      <span
        className="text-xs font-bold px-2.5 py-0.5 rounded-full"
        style={{ color: grade.color, background: `${grade.color}20`, border: `1px solid ${grade.color}40` }}
      >
        {grade.label}
      </span>
    </div>
  );
}

function SeoCheckItem({ check }: { check: SeoCheck }) {
  const icon =
    check.status === "pass" ? (
      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
    ) : check.status === "warn" ? (
      <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
    ) : (
      <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
    );

  const pts = check.status === "pass" ? check.points : check.status === "warn" ? Math.round(check.points * 0.5) : 0;

  return (
    <div className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border transition-colors ${
      check.status === "pass"
        ? "bg-green-500/5 border-green-500/15"
        : check.status === "warn"
        ? "bg-amber-500/5 border-amber-500/15"
        : "bg-red-500/5 border-red-500/15"
    }`}>
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] font-semibold text-slate-300 leading-tight truncate">{check.label}</p>
          <span className={`text-[9px] font-bold tabular-nums flex-shrink-0 ${
            check.status === "pass" ? "text-green-400" : check.status === "warn" ? "text-amber-400" : "text-slate-600"
          }`}>
            +{pts}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">{check.description}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BlogPostForm({ mode, initialData }: BlogPostFormProps) {
  const router = useRouter();
  const toast = useToast();

  // Form state
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [summary, setSummary] = useState(initialData?.bodyOverview ?? initialData?.summary ?? "");
  const [body, setBody] = useState(initialData?.body ?? initialData?.content ?? "");
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? false);
  const [publishedAt, setPublishedAt] = useState(
    initialData?.publishedAt ? initialData.publishedAt.slice(0, 16) : ""
  );
  const [blogCategoryId, setBlogCategoryId] = useState(initialData?.blogCategoryId ?? "");
  const [relatedBlogPostIds, setRelatedBlogPostIds] = useState<string[]>(initialData?.relatedBlogPostIds ?? []);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [allowComments, setAllowComments] = useState(initialData?.allowComments ?? true);
  const [showOnHomePage, setShowOnHomePage] = useState(initialData?.showOnHomePage ?? false);
  const [includeInSitemap, setIncludeInSitemap] = useState(initialData?.includeInSitemap ?? true);
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder ?? 0);
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription ?? "");
  const [metaKeywords, setMetaKeywords] = useState(initialData?.metaKeywords ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnailImageUrl ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [allBlogPosts, setAllBlogPosts] = useState<BlogPost[]>([]);
  const [loadingRelatedPosts, setLoadingRelatedPosts] = useState(true);
  const [relatedPostSearch, setRelatedPostSearch] = useState("");
  const [showRelatedDropdown, setShowRelatedDropdown] = useState(false);
  const relatedDropdownRef = useRef<HTMLDivElement>(null);

  // Load categories
  useEffect(() => {
    blogCategoriesService
      .getAll()
      .then((r) => {
        const data = r?.data?.data ?? r?.data ?? [];
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => {
    blogPostsService
      .getAll(true, false)
      .then((r) => {
        const data = r?.data?.data ?? [];
        const currentId = initialData?.id;
        const posts = Array.isArray(data)
          ? data
              .filter((post) => !post.isDeleted && post.id !== currentId)
              .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
          : [];
        setAllBlogPosts(posts);
      })
      .catch(() => setAllBlogPosts([]))
      .finally(() => setLoadingRelatedPosts(false));
  }, [initialData?.id]);

  useEffect(() => {
    if (!showRelatedDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        relatedDropdownRef.current &&
        !relatedDropdownRef.current.contains(event.target as Node)
      ) {
        setShowRelatedDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRelatedDropdown]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugTouched && title) setSlug(generateSlug(title));
  }, [title, slugTouched]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = useCallback((): boolean => {
    const e: FormErrors = {};
    if (!title.trim()) e.title = "Title is required.";
    else if (title.trim().length < 3) e.title = "Title must be at least 3 characters.";
    else if (title.trim().length > 200) e.title = "Title must be under 200 characters.";

    if (!slug.trim()) e.slug = "Slug is required.";
    else if (!/^[a-z0-9-]+$/.test(slug)) e.slug = "Slug can only contain lowercase letters, numbers, and hyphens.";

    if (!body || body.replace(/<[^>]+>/g, "").trim().length < 10)
      e.body = "Content is required (minimum 10 characters).";

    if (metaTitle && metaTitle.length > 60) e.metaTitle = "Meta title must be under 60 characters.";
    if (metaDescription && metaDescription.length > 160)
      e.metaDescription = "Meta description must be under 160 characters.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [title, slug, body, metaTitle, metaDescription]);

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave(publish?: boolean) {
    if (!validate()) {
      toast.error("Please fix the errors before saving.");
      return;
    }
    setSaving(true);
    const payload: Partial<BlogPost> = {
      title: title.trim(),
      slug: slug.trim(),
      bodyOverview: summary || undefined,
      body,
      isPublished: publish !== undefined ? publish : isPublished,
      publishedAt: publishedAt || undefined,
      blogCategoryId: blogCategoryId || null,
      relatedBlogPostIds,
      tags,
      allowComments,
      showOnHomePage,
      includeInSitemap,
      displayOrder,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      metaKeywords: metaKeywords || undefined,
      thumbnailImageUrl: thumbnailUrl || undefined,
    };

    try {
      if (mode === "create") {
        const r = await blogPostsService.create(payload);
        if (r.data?.success) {
          toast.success("Blog post created!");
          router.push("/admin/BlogPosts");
        } else throw new Error(r.data?.message || "Failed to create.");
      } else {
        const r = await blogPostsService.update(initialData!.id, { ...payload, id: initialData!.id });
        if (r.data?.success) {
          toast.success("Blog post updated!");
          router.push("/admin/BlogPosts");
        } else throw new Error(r.data?.message || "Failed to update.");
      }
    } catch (e: any) {
      toast.error(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  // ── Thumbnail Upload ──────────────────────────────────────────────────────
  async function handleThumbUpload(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB."); return; }
    setUploadingThumb(true);
    try {
      const r = await blogPostsService.uploadImage(file, { type: "thumbnail" });
      const url = r?.data?.data ?? (r?.data as any);
      if (url) {
        const resolved = url.startsWith("http") ? url : `${API_BASE_URL}/${url.replace(/^\//, "")}`;
        setThumbnailUrl(resolved);
        toast.success("Image uploaded!");
      }
    } catch { toast.error("Upload failed."); }
    finally { setUploadingThumb(false); }
  }

  // ── Tags ─────────────────────────────────────────────────────────────────
  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function addRelatedPost(postId: string) {
    setRelatedBlogPostIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
    setRelatedPostSearch("");
    setShowRelatedDropdown(false);
  }

  function removeRelatedPost(postId: string) {
    setRelatedBlogPostIds((prev) => prev.filter((id) => id !== postId));
  }

  const filteredRelatedPosts = useMemo(() => {
    const search = relatedPostSearch.trim().toLowerCase();
    const availablePosts = allBlogPosts.filter((post) => {
      if (relatedBlogPostIds.includes(post.id)) return false;
      if (!search) return true;
      return (post.title || "").toLowerCase().includes(search);
    });
    return search ? availablePosts : availablePosts.slice(0, 5);
  }, [allBlogPosts, relatedBlogPostIds, relatedPostSearch]);

  const selectedRelatedPosts = useMemo(() => {
    return relatedBlogPostIds.map((id) => {
      const post = allBlogPosts.find((item) => item.id === id);
      return {
        id,
        title: post?.title || "Unknown Post",
        blogCategoryName: post?.blogCategoryName || "",
        isPublished: post?.isPublished ?? false,
      };
    });
  }, [allBlogPosts, relatedBlogPostIds]);

  // ── SEO Score (live) ──────────────────────────────────────────────────────
  const seo = useMemo(
    () => computeSeo(title, slug, body, summary, metaTitle, metaDescription, metaKeywords, thumbnailUrl, tags, blogCategoryId),
    [title, slug, body, summary, metaTitle, metaDescription, metaKeywords, thumbnailUrl, tags, blogCategoryId]
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 88px)" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/BlogPosts")}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
              {mode === "create" ? "Create New Post" : "Edit Post"}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {mode === "create" ? "Write and publish a new blog post" : `Editing: ${initialData?.title ?? ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-600 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700/50 hover:text-white transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {isPublished ? "Save & Publish" : "Publish"}
          </button>
        </div>
      </div>

      {/* ── 2-column layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 flex-1 min-h-0">
        {/* ── LEFT: Main Content ──────────────────────────────────────── */}
        <div className="space-y-4 overflow-y-auto pr-1 pb-6" style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 #1e293b" }}>
          {/* Title & Slug */}
          <SectionCard title="Post Details" icon={<FileText className="w-3.5 h-3.5" />}>
            <div className="space-y-3">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={label}>Title *</label>
                  <CharCounter value={title} max={200} />
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title..."
                  className={`${inp} text-base font-medium ${errors.title ? "border-red-500 focus:ring-red-500" : ""}`}
                />
                {errors.title && (
                  <p className="flex items-center gap-1 mt-1 text-[11px] text-red-400">
                    <AlertCircle className="w-3 h-3" /> {errors.title}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className={label}>URL Slug *</label>
                <div className={`flex items-center bg-slate-800 border rounded-lg overflow-hidden transition-all focus-within:ring-1 ${errors.slug ? "border-red-500 focus-within:ring-red-500" : "border-slate-700 focus-within:border-violet-500 focus-within:ring-violet-500"}`}>
                  <span className="flex items-center h-full px-3 py-2 bg-slate-700/50 border-r border-slate-700 text-slate-400 text-xs font-mono whitespace-nowrap select-none">
                    /blog/
                  </span>
                  <input
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    }}
                    placeholder="post-slug"
                    className="flex-1 px-3 py-2 bg-transparent text-white text-sm font-mono placeholder-slate-500 focus:outline-none"
                  />
                </div>
                {errors.slug && (
                  <p className="flex items-center gap-1 mt-1 text-[11px] text-red-400">
                    <AlertCircle className="w-3 h-3" /> {errors.slug}
                  </p>
                )}
              </div>

              {/* Summary */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={label}>Excerpt / Summary</label>
                  <CharCounter value={summary} max={500} />
                </div>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  placeholder="Short description shown in post listings..."
                  className={`${inp} resize-none`}
                  maxLength={500}
                />
              </div>
            </div>
          </SectionCard>

          {/* Content Editor */}
          <SectionCard title="Content" icon={<AlignLeft className="w-3.5 h-3.5" />}>
            <div>
              {errors.body && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.body}
                </div>
              )}
              <ProductDescriptionEditor
                value={body}
                onChange={setBody}
                placeholder="Write your blog post content here..."
                height={420}
              />
            </div>
          </SectionCard>

          {/* SEO */}
          <SectionCard title="SEO Settings" icon={<Globe className="w-3.5 h-3.5" />} collapsible defaultOpen={false}>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={label}>Meta Title</label>
                  <CharCounter value={metaTitle} max={60} />
                </div>
                <input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO title (leave blank to use post title)"
                  className={`${inp} ${errors.metaTitle ? "border-red-500 focus:ring-red-500" : ""}`}
                  maxLength={70}
                />
                {errors.metaTitle && (
                  <p className="flex items-center gap-1 mt-1 text-[11px] text-red-400">
                    <AlertCircle className="w-3 h-3" /> {errors.metaTitle}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={label}>Meta Description</label>
                  <CharCounter value={metaDescription} max={160} />
                </div>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                  placeholder="SEO description for search engines..."
                  className={`${inp} resize-none ${errors.metaDescription ? "border-red-500 focus:ring-red-500" : ""}`}
                  maxLength={170}
                />
                {errors.metaDescription && (
                  <p className="flex items-center gap-1 mt-1 text-[11px] text-red-400">
                    <AlertCircle className="w-3 h-3" /> {errors.metaDescription}
                  </p>
                )}
              </div>
              <div>
                <label className={label}>Meta Keywords</label>
                <input
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                  className={inp}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT: Sidebar ──────────────────────────────────────────── */}
        <div className="space-y-4 overflow-y-auto pb-6" style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 #1e293b" }}>
          {/* ── SEO Score Card ───────────────────────────────────────── */}
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50 sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">SEO Analysis</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Live
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Ring */}
              <div className="flex justify-center">
                <SeoScoreRing score={seo.score} />
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500">Overall score</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{seo.score}/100 pts</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${seo.score}%`,
                      background:
                        seo.score >= 80 ? "#22c55e" :
                        seo.score >= 60 ? "#84cc16" :
                        seo.score >= 35 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
              </div>

              {/* Summary counts */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "Pass", count: seo.checks.filter(c => c.status === "pass").length, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
                  { label: "Warn", count: seo.checks.filter(c => c.status === "warn").length, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                  { label: "Fail", count: seo.checks.filter(c => c.status === "fail").length, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                ].map(({ label, count, color, bg }) => (
                  <div key={label} className={`flex flex-col items-center py-1.5 rounded-lg border ${bg}`}>
                    <span className={`text-base font-bold ${color}`}>{count}</span>
                    <span className="text-[9px] text-slate-500">{label}</span>
                  </div>
                ))}
              </div>

              {/* Checklist — inner scroll */}
              <div>
                <p className="text-[10px] text-slate-500 font-medium mb-1.5">Checks ({seo.checks.length})</p>
                <div
                  className="space-y-1.5 overflow-y-auto max-h-72 pr-0.5"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 #0f172a" }}
                >
                  {seo.checks.map((check) => (
                    <SeoCheckItem key={check.key} check={check} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Publish Settings */}
          <SectionCard title="Publish" icon={<Send className="w-3.5 h-3.5" />}>
            <div className="space-y-3">
              {/* Status toggle */}
              <div className="flex items-center justify-between p-2.5 bg-slate-700/30 rounded-lg border border-slate-700/50">
                <div>
                  <p className="text-xs font-semibold text-slate-300">
                    {isPublished ? "Published" : "Draft"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {isPublished ? "Visible to readers" : "Not publicly visible"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPublished ? "bg-green-500" : "bg-slate-600"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isPublished ? "translate-x-4.5" : "translate-x-0.5"}`} style={{ transform: isPublished ? "translateX(18px)" : "translateX(2px)" }} />
                </button>
              </div>

              {/* Publish date */}
              <div>
                <label className={label}>Publish Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className={`${inp} pl-8`}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {isPublished ? "Save & Publish" : "Publish"}
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-600 text-slate-400 text-xs font-medium rounded-lg hover:bg-slate-700/50 hover:text-white transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Draft
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Thumbnail */}
          <SectionCard title="Thumbnail" icon={<ImageIcon className="w-3.5 h-3.5" />}>
            <div className="space-y-2">
              {thumbnailUrl ? (
                <div className="relative group">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-36 object-cover rounded-lg border border-slate-700"
                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}

                  />
                  <button
                    onClick={() => setThumbnailUrl("")}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all">
                  {uploadingThumb ? (
                    <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-5 h-5 text-slate-500 mb-1.5" />
                      <span className="text-xs text-slate-500">Click to upload thumbnail</span>
                      <span className="text-[10px] text-slate-600 mt-0.5">PNG, JPG, WebP — max 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleThumbUpload(e.target.files[0])}
                  />
                </label>
              )}
            </div>
          </SectionCard>

          {/* Category */}
          <SectionCard title="Category" icon={<BookOpen className="w-3.5 h-3.5" />}>
            <select
              value={blogCategoryId}
              onChange={(e) => setBlogCategoryId(e.target.value)}
              className={inp}
              disabled={loadingCats}
            >
              <option value="">— No Category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </SectionCard>

          <SectionCard
            title="Related Posts"
            icon={<Link2 className="w-3.5 h-3.5" />}
            overflowVisible
            className={showRelatedDropdown ? "relative z-30" : "relative z-0"}
          >
            <div ref={relatedDropdownRef} className="space-y-2">
              <div className="relative">
                <input
                  value={relatedPostSearch}
                  onChange={(e) => {
                    setRelatedPostSearch(e.target.value);
                    setShowRelatedDropdown(true);
                  }}
                  onFocus={() => setShowRelatedDropdown(true)}
                  placeholder="Search posts to relate..."
                  className={inp}
                />

                {showRelatedDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
                    {loadingRelatedPosts ? (
                      <div className="px-3 py-2 text-xs text-slate-500">Loading posts...</div>
                    ) : filteredRelatedPosts.length > 0 ? (
                      <div
                        className="max-h-64 overflow-y-auto py-1"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 #1e293b" }}
                      >
                        {filteredRelatedPosts.map((post) => (
                          <button
                            key={post.id}
                            type="button"
                            onClick={() => addRelatedPost(post.id)}
                            className="w-full px-3 py-2 text-left hover:bg-slate-800 transition-colors"
                          >
                            <p className="text-xs font-medium leading-5 text-slate-200 break-words line-clamp-2">
                              {post.title}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              {post.blogCategoryName || "Uncategorized"} · {post.isPublished ? "Published" : "Draft"}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-xs text-slate-500">
                        {relatedPostSearch.trim() ? "No matching posts found." : "No more posts available."}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedRelatedPosts.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedRelatedPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-5 text-slate-200 break-words line-clamp-2">
                          {post.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {post.blogCategoryName || "Uncategorized"} · {post.isPublished ? "Published" : "Draft"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRelatedPost(post.id)}
                        className="mt-0.5 rounded-md p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">No related posts selected.</p>
              )}
            </div>
          </SectionCard>

          {/* Tags */}
          <SectionCard title="Tags" icon={<Tag className="w-3.5 h-3.5" />}>
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
                  }}
                  placeholder="Add tag, press Enter"
                  className={`flex-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors`}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-2.5 py-1.5 bg-violet-500/20 border border-violet-500/40 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] rounded-full"
                    >
                      <Hash className="w-2.5 h-2.5" />
                      {t}
                      <button
                        onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                        className="text-violet-400 hover:text-white ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Settings */}
          <SectionCard title="Settings" icon={<Settings className="w-3.5 h-3.5" />} collapsible defaultOpen={true}>
            <div className="space-y-2.5">
              {[
                { label: "Allow Comments", value: allowComments, set: setAllowComments, desc: "Readers can leave comments" },
                { label: "Show on Home Page", value: showOnHomePage, set: setShowOnHomePage, desc: "Feature this post on homepage" },
                { label: "Include in Sitemap", value: includeInSitemap, set: setIncludeInSitemap, desc: "Helps search engine indexing" },
              ].map(({ label: lbl, value, set, desc }) => (
                <div key={lbl} className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0">
                  <div>
                    <p className="text-xs text-slate-300 font-medium">{lbl}</p>
                    <p className="text-[10px] text-slate-500">{desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set((v: boolean) => !v)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${value ? "bg-violet-500" : "bg-slate-600"}`}
                  >
                    <span
                      className="inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform"
                      style={{ transform: value ? "translateX(14px)" : "translateX(2px)" }}
                    />
                  </button>
                </div>
              ))}
              <div className="pt-1">
                <label className={label}>Display Order</label>
                <input
                  type="number"
                  min={0}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className={inp}
                />
              </div>
              
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
