"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Sliders, CheckCircle, AlertCircle, Sparkles, X, Layout, Code, Eye, RefreshCw } from "lucide-react";
import { useToast } from "@/app/admin/_components/CustomToast";
import ConfirmDialog from "@/app/admin/_components/ConfirmDialog";
import { aplusTemplatesService, APlusTemplate, APlusTemplateField } from "@/lib/services/aplusTemplates";
import { uploadEditorImage } from "@/lib/services/editorService";

import PremiumTemplate from "@/components/aplus/templates/PremiumTemplate";
import DarkLuxuryTemplate from "@/components/aplus/templates/DarkLuxuryTemplate";
import CleanMinimalTemplate from "@/components/aplus/templates/CleanMinimalTemplate";
import BoldModernTemplate from "@/components/aplus/templates/BoldModernTemplate";

const getSvgPlaceholder = (key: string, label: string) => {
  const width = 800;
  const height = 350;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="grad_${key}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#312e81;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#4c1d95;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad_${key})" />
    <rect x="15" y="15" width="${width - 30}" height="${height - 30}" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-dasharray="6 4" rx="8" />
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">
      [${key}]
    </text>
    <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#ddd6fe">
      ${label}
    </text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

const generateMockContent = (sectionsJsonStr: string) => {
  try {
    const fields = JSON.parse(sectionsJsonStr || "[]");
    const mockObj: Record<string, string> = {};
    fields.forEach((f: any) => {
      if (f.key) {
        if (f.type === "image") {
          mockObj[f.key] = getSvgPlaceholder(f.key, f.label || f.key);
        } else if (f.type === "textarea") {
          mockObj[f.key] = `[${f.key}]: ${f.label || f.key} - This is sample text inside the textarea. It demonstrates where the text content for this layout parameter will render in the customer view.`;
        } else {
          mockObj[f.key] = `[${f.key}]`;
        }
      }
    });
    return mockObj;
  } catch {
    return {};
  }
};

interface TemplateVisualPreviewProps {
  template: APlusTemplate;
}

function TemplateVisualPreview({ template }: TemplateVisualPreviewProps) {
  const nameLower = template.name.toLowerCase();

  // Generate mock content
  const mockContent = generateMockContent(template.sectionsJson);

  // Decide which preset layout style to use
  let layoutType: "premium" | "darkLuxury" | "cleanMinimal" | "boldModern" | "custom" = "premium";
  if (nameLower.includes("dark") || nameLower.includes("luxury") || nameLower.includes("black")) {
    layoutType = "darkLuxury";
  } else if (nameLower.includes("minimal") || nameLower.includes("clean") || nameLower.includes("white")) {
    layoutType = "cleanMinimal";
  } else if (nameLower.includes("modern") || nameLower.includes("bold") || nameLower.includes("accent")) {
    layoutType = "boldModern";
  } else if (nameLower.includes("premium")) {
    layoutType = "premium";
  } else {
    let fields: APlusTemplateField[] = [];
    try {
      fields = JSON.parse(template.sectionsJson || "[]");
    } catch {}
    
    // Infer from visual schema keys to be robust against custom template names
    const keys = fields.map(f => f.key);
    if (keys.some(k => k.startsWith("faq") || k.startsWith("split3") || k.includes("featHeading") || k.includes("featuresHeading") || k.startsWith("split1"))) {
      layoutType = "premium";
    } else if (keys.some(k => k.startsWith("split2"))) {
      layoutType = "darkLuxury";
    } else if (keys.some(k => k.includes("feature2") || k.includes("feat2"))) {
      layoutType = "boldModern";
    } else if (keys.some(k => k.includes("feature1") || k.includes("feat1"))) {
      layoutType = "cleanMinimal";
    } else {
      const prebuiltKeys = [
        "heroTitle", "heroSubtitle", "heroImage", "heroTag",
        "featHeading", "featuresHeading",
        "feature1Title", "feature1Desc", "feat1Title", "feat1Desc",
        "feature2Title", "feature2Desc", "feat2Title", "feat2Desc",
        "feature3Title", "feature3Desc", "feat3Title", "feat3Desc",
        "feature4Title", "feature4Desc", "feat4Title", "feat4Desc",
        "feature5Title", "feature5Desc", "feat5Title", "feat5Desc",
        "split1Image", "split1Title", "split1Text", "split1Desc",
        "split2Image", "split2Title", "split2Text", "split2Desc",
        "split3Image", "split3Title", "split3Text", "split3Desc",
        "faq1Question", "faq1Answer", "faq2Question", "faq2Answer", "faq3Question", "faq3Answer"
      ];
      const hasCustomKeys = fields.some(f => !prebuiltKeys.includes(f.key));
      if (hasCustomKeys) {
        layoutType = "custom";
      } else {
        layoutType = "premium";
      }
    }
  }

  const renderCustomFallback = () => {
    let fields: APlusTemplateField[] = [];
    try {
      fields = JSON.parse(template.sectionsJson);
    } catch { }

    if (fields.length === 0) {
      return (
        <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-3xl">
          No fields defined for this custom template schema.
        </div>
      );
    }

    return (
      <div className="space-y-8 bg-white text-slate-900 border border-slate-150 rounded-3xl p-5 sm:p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <Layout className="h-5 w-5 text-violet-650" />
          <h4 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">{template.name}</h4>
        </div>

        {template.description && (
          <p className="text-xs text-slate-500 italic max-w-xl -mt-4">{template.description}</p>
        )}

        <div className="space-y-6">
          {fields.map((field) => {
            const val = mockContent[field.key] || "";

            if (field.type === "image") {
              return (
                <div key={field.key} className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{field.label} ({field.key})</span>
                  <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm aspect-video max-h-[380px] flex items-center justify-center">
                    <img src={val} alt={field.label} className="w-full h-full object-cover" />
                  </div>
                </div>
              );
            }

            if (field.type === "textarea") {
              return (
                <div key={field.key} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{field.label} ({field.key})</span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">{val}</p>
                </div>
              );
            }

            return (
              <div key={field.key} className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{field.label} ({field.key})</span>
                <p className="text-sm font-bold text-slate-800">{val}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  switch (layoutType) {
    case "darkLuxury":
      return <DarkLuxuryTemplate data={mockContent} />;
    case "cleanMinimal":
      return <CleanMinimalTemplate data={mockContent} />;
    case "boldModern":
      return <BoldModernTemplate data={mockContent} />;
    case "custom":
      return renderCustomFallback();
    case "premium":
    default:
      return <PremiumTemplate data={mockContent} />;
  }
}

const PRESET_SCHEMAS: Record<string, { name: string; desc: string; schema: APlusTemplateField[] }> = {
  premium: {
    name: "Premium Template",
    desc: "A rich layout with a Hero Banner, Feature Grid, Split image section, and FAQ accordion.",
    schema: [
      { key: "heroTitle", label: "Hero Banner Title", type: "text" },
      { key: "heroSubtitle", label: "Hero Banner Subtitle", type: "text" },
      { key: "heroImage", label: "Hero Banner Image URL", type: "image" },
      { key: "feature1Title", label: "Feature 1 Title", type: "text" },
      { key: "feature1Desc", label: "Feature 1 Description", type: "textarea" },
      { key: "split1Image", label: "Split Section Image", type: "image" },
      { key: "split1Title", label: "Split Section Title", type: "text" },
      { key: "split1Text", label: "Split Section Text", type: "textarea" },
      { key: "faq1Question", label: "FAQ Question 1", type: "text" },
      { key: "faq1Answer", label: "FAQ Answer 1", type: "textarea" }
    ]
  },
  darkLuxury: {
    name: "Dark Luxury Template",
    desc: "Sleek dark mode styling with split banners and alternating text-image rows.",
    schema: [
      { key: "heroTitle", label: "Luxury Hero Title", type: "text" },
      { key: "heroSubtitle", label: "Luxury Hero Subtitle", type: "text" },
      { key: "heroImage", label: "Luxury Hero Image URL", type: "image" },
      { key: "split1Image", label: "Left Image", type: "image" },
      { key: "split1Title", label: "Left Block Title", type: "text" },
      { key: "split1Text", label: "Left Block Text", type: "textarea" },
      { key: "split2Image", label: "Right Image", type: "image" },
      { key: "split2Title", label: "Right Block Title", type: "text" },
      { key: "split2Text", label: "Right Block Text", type: "textarea" }
    ]
  },
  cleanMinimal: {
    name: "Clean Minimal Template",
    desc: "A spacious layout focus on clean typography, bullet points, and single focal image.",
    schema: [
      { key: "heroTitle", label: "Minimalist Title", type: "text" },
      { key: "heroImage", label: "Minimalist Hero Image URL", type: "image" },
      { key: "feature1Title", label: "Highlight Title", type: "text" },
      { key: "feature1Desc", label: "Highlight Description", type: "textarea" }
    ]
  },
  boldModern: {
    name: "Bold Modern Template",
    desc: "Vibrant accent layout using offset details, badge features, and highlight cards.",
    schema: [
      { key: "heroTitle", label: "Modern Accent Title", type: "text" },
      { key: "heroSubtitle", label: "Modern Accent Subtitle", type: "text" },
      { key: "heroImage", label: "Modern Accent Image URL", type: "image" },
      { key: "feature1Title", label: "Feature 1 Title", type: "text" },
      { key: "feature1Desc", label: "Feature 1 Details", type: "textarea" },
      { key: "feature2Title", label: "Feature 2 Title", type: "text" },
      { key: "feature2Desc", label: "Feature 2 Details", type: "textarea" }
    ]
  }
};

const generateSampleJson = (sectionsJsonStr: string) => {
  try {
    const fields = JSON.parse(sectionsJsonStr || "[]");
    const sampleObj: Record<string, string> = {};
    fields.forEach((f: any) => {
      if (f.key) {
        if (f.type === "image") {
          sampleObj[f.key] = `[Image URL: ${f.label || f.key}]`;
        } else if (f.type === "textarea") {
          sampleObj[f.key] = `[Paragraph text: ${f.label || f.key}]`;
        } else {
          sampleObj[f.key] = `[Text: ${f.label || f.key}]`;
        }
      }
    });
    return JSON.stringify(sampleObj, null, 2);
  } catch {
    return "{}";
  }
};

export default function APlusTemplatesPage() {
  const toast = useToast();
  const [templates, setTemplates] = useState<APlusTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<APlusTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "schema">("general");
  const [schemaEditMode, setSchemaEditMode] = useState<"visual" | "json">("visual");

  // Form Fields State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [fields, setFields] = useState<APlusTemplateField[]>([]);
  const [rawJson, setRawJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [selectedSampleTemplate, setSelectedSampleTemplate] = useState<APlusTemplate | null>(null);
  const [previewTab, setPreviewTab] = useState<"visual" | "json">("visual");

  // Deletion state
  const [deleteConfirm, setDeleteConfirm] = useState<APlusTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await aplusTemplatesService.getAll({ includeInactive: true });
      if (res.data?.success) {
        setTemplates(res.data.data || []);
      } else {
        toast.error(res.data?.message || "Failed to load templates");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error fetching templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && t.isActive) ||
      (statusFilter === "inactive" && !t.isActive);
    return matchesSearch && matchesStatus;
  });

  // Open creation modal
  const handleCreateOpen = () => {
    setEditingTemplate(null);
    setName("");
    setDescription("");
    setThumbnailUrl("");
    setIsActive(true);
    setDisplayOrder(templates.length + 1);
    setFields([...PRESET_SCHEMAS.premium.schema]);
    setRawJson(JSON.stringify(PRESET_SCHEMAS.premium.schema, null, 2));
    setJsonError(null);
    setActiveTab("general");
    setSchemaEditMode("visual");
    setShowModal(true);
  };

  // Open edit modal
  const handleEditOpen = (template: APlusTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description || "");
    setThumbnailUrl(template.thumbnailUrl || "");
    setIsActive(template.isActive);
    setDisplayOrder(template.displayOrder);

    let parsedFields: APlusTemplateField[] = [];
    try {
      parsedFields = JSON.parse(template.sectionsJson);
    } catch {
      parsedFields = [];
    }

    setFields(parsedFields);
    setRawJson(JSON.stringify(parsedFields, null, 2));
    setJsonError(null);
    setActiveTab("general");
    setSchemaEditMode("visual");
    setShowModal(true);
  };

  // Preset Selection Handler
  const handlePresetSelect = (presetKey: string) => {
    const preset = PRESET_SCHEMAS[presetKey];
    if (preset) {
      setFields([...preset.schema]);
      setRawJson(JSON.stringify(preset.schema, null, 2));
      setJsonError(null);
      toast.info(`Loaded ${preset.name} Schema! 🎉`);
    }
  };

  // Handle image upload for template thumbnail
  const handleThumbnailUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const res = await uploadEditorImage(file);
      if (res.location) {
        setThumbnailUrl(res.location);
        toast.success("Thumbnail image uploaded! 🖼️");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Dynamic field handlers (Visual Mode)
  const addField = () => {
    const newField: APlusTemplateField = {
      key: `field_${Date.now()}`,
      label: "New Field",
      type: "text"
    };
    const updated = [...fields, newField];
    setFields(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const removeField = (index: number) => {
    const updated = fields.filter((_, idx) => idx !== index);
    setFields(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const updateFieldProperty = (index: number, key: keyof APlusTemplateField, val: any) => {
    const updated = fields.map((field, idx) =>
      idx === index ? { ...field, [key]: val } : field
    );
    setFields(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  // Sync JSON input with Visual field schema
  const handleJsonChange = (val: string) => {
    setRawJson(val);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        setFields(parsed);
        setJsonError(null);
      } else {
        setJsonError("JSON must be an array of objects.");
      }
    } catch (err: any) {
      setJsonError(`Invalid JSON: ${err.message}`);
    }
  };

  // Save template handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (jsonError) {
      toast.error("Please fix the JSON schema errors before saving.");
      return;
    }

    setIsSubmitting(true);
    try {
      const serializedSchema = JSON.stringify(fields);

      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        sectionsJson: serializedSchema,
        isActive,
        displayOrder: Number(displayOrder) || 1
      };

      let res;
      if (editingTemplate) {
        payload.id = editingTemplate.id;
        res = await aplusTemplatesService.update(editingTemplate.id, payload);
      } else {
        res = await aplusTemplatesService.create(payload);
      }

      if (res.data?.success) {
        toast.success(`Template ${editingTemplate ? "updated" : "created"} successfully! 🎉`);
        setShowModal(false);
        fetchTemplates();
      } else {
        toast.error(res.data?.message || "Failed to save template");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "An error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete template handler
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const res = await aplusTemplatesService.delete(deleteConfirm.id);
      if (res.data?.success) {
        toast.success("Template deleted successfully! 🗑️");
        setDeleteConfirm(null);
        fetchTemplates();
      } else {
        toast.error(res.data?.message || "Failed to delete template");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "An error occurred during deletion");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-violet-400">
            <Sparkles className="h-6 w-6 text-violet-400" />
            A+ Content Template Library
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create and manage visual design templates for product rich description layouts.
          </p>
        </div>

        <button
          onClick={handleCreateOpen}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Template
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search templates by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850/60 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-violet-500 text-slate-200 placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-850/60 px-3 py-1.5 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Templates</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <button
          onClick={fetchTemplates}
          title="Refresh templates"
          className="p-2 border border-slate-850/60 bg-slate-950 hover:bg-slate-900/60 transition rounded-xl text-slate-400"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* TEMPLATES LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          <p className="text-slate-500 text-sm">Loading A+ templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-850/60 rounded-2xl">
          <Layout className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-sm">No templates found</p>
          <p className="text-slate-500 text-xs mt-1">Try resetting filters or add your first template.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => {
            let fieldCount = 0;
            try {
              fieldCount = JSON.parse(template.sectionsJson || "[]").length;
            } catch { }

            return (
              <div
                key={template.id}
                className="bg-slate-900/40 border border-slate-850/60 hover:border-violet-500/55 rounded-2xl p-5 flex flex-col justify-between transition-all group duration-300 shadow-sm"
              >
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-850/60 mb-4 flex items-center justify-center">
                    {template.thumbnailUrl ? (
                      <img
                        src={template.thumbnailUrl}
                        alt={template.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-350"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/placeholder-product.png";
                        }}
                      />
                    ) : (
                      <Layout className="h-12 w-12 text-slate-700" />
                    )}

                    <span
                      className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${template.isActive
                        ? "bg-white text-emerald-400 border-emerald-500/20"
                        : "bg-rose-950/40 text-rose-400 border-rose-500/20"
                        }`}
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-200 line-clamp-1 group-hover:text-violet-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 h-8">
                    {template.description || "No description provided."}
                  </p>

                  <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-400 border-t border-slate-850/40 pt-3">
                    <div>
                      Order: <span className="font-bold text-slate-300">{template.displayOrder}</span>
                    </div>
                    <div>
                      Fields: <span className="font-bold text-violet-400">{fieldCount} fields</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => {
                      setSelectedSampleTemplate(template);
                      setPreviewTab("visual");
                    }}
                    title="Preview template UI layout"
                    className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-violet-400 border border-slate-800/80 rounded-xl text-xs font-semibold transition flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditOpen(template)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(template)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 rounded-xl text-xs font-semibold border border-rose-950/40 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800/60">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Layout className="h-5 w-5 text-violet-400" />
                  {editingTemplate ? `Edit Template: ${editingTemplate.name}` : "Create New A+ Template"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Define metadata and custom sections layout.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs Trigger */}
            <div className="flex border-b border-slate-800/40 px-6 bg-slate-900/50">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`py-3 px-4 text-xs font-bold transition-all border-b-2 ${activeTab === "general" ? "border-violet-500 text-violet-400" : "border-transparent text-slate-400 hover:text-slate-300"
                  }`}
              >
                1. General Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("schema")}
                className={`py-3 px-4 text-xs font-bold transition-all border-b-2 ${activeTab === "schema" ? "border-violet-500 text-violet-400" : "border-transparent text-slate-400 hover:text-slate-300"
                  }`}
              >
                2. Layout Schema
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto flex flex-col">
              {/* Tab Content: General */}
              {activeTab === "general" && (
                <div className="p-6 space-y-4 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left fields column */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-semibold mb-1">Template Name *</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Premium Non-Stick Template"
                          className="w-full bg-slate-950 border border-slate-800/80 px-3.5 py-2 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 font-semibold mb-1">Description</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="A short description explaining when to use this layout..."
                          rows={4}
                          className="w-full bg-slate-950 border border-slate-800/80 px-3.5 py-2 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 font-semibold mb-1">Display Order</label>
                          <input
                            type="number"
                            value={displayOrder}
                            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-950 border border-slate-800/80 px-3.5 py-2 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                          />
                        </div>
                        <div className="flex flex-col justify-end pb-1">
                          <label className="flex items-center gap-2 text-sm cursor-pointer select-none text-slate-300 py-2">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={(e) => setIsActive(e.target.checked)}
                              className="rounded accent-violet-600 bg-slate-950 border-slate-800 h-4 w-4"
                            />
                            Active / Publish
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Right thumbnail column */}
                    <div className="space-y-3">
                      <label className="block text-xs text-slate-400 font-semibold">Template Thumbnail</label>
                      <div className="border border-slate-800/80 bg-slate-950 rounded-2xl aspect-video overflow-hidden flex flex-col items-center justify-center relative p-3">
                        {thumbnailUrl ? (
                          <>
                            <img
                              src={thumbnailUrl}
                              alt="Thumbnail preview"
                              className="w-full h-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => setThumbnailUrl("")}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-slate-300 hover:text-white"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="text-center space-y-2">
                            <Layout className="h-8 w-8 text-slate-700 mx-auto" />
                            <p className="text-[10px] text-slate-500">No thumbnail set</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Or paste image URL here..."
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                        />
                        <div className="relative">
                          <input
                            type="file"
                            id="thumbnail-upload"
                            accept="image/*"
                            disabled={uploadingImage}
                            onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])}
                            className="hidden"
                          />
                          <label
                            htmlFor="thumbnail-upload"
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-slate-700 hover:bg-slate-950 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition disabled:opacity-50"
                          >
                            {uploadingImage ? "Uploading..." : "Upload local image"}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Layout Schema */}
              {activeTab === "schema" && (
                <div className="p-6 space-y-4 flex-1 flex flex-col min-h-[400px]">
                  {/* Preset & Editor Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/40 p-4 border border-slate-850/60 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-semibold">Load Layout Preset:</span>
                      <select
                        onChange={(e) => e.target.value && handlePresetSelect(e.target.value)}
                        defaultValue=""
                        className="bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                      >
                        <option value="" disabled>-- Select Preset --</option>
                        <option value="premium">Premium Design Schema</option>
                        <option value="darkLuxury">Dark Luxury Schema</option>
                        <option value="cleanMinimal">Clean Minimal Schema</option>
                        <option value="boldModern">Bold Modern Schema</option>
                      </select>
                    </div>

                    <div className="flex gap-1 border border-slate-800/80 bg-slate-950 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSchemaEditMode("visual")}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${schemaEditMode === "visual" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-300"
                          }`}
                      >
                        <Layout className="h-3.5 w-3.5" />
                        Visual Builder
                      </button>
                      <button
                        type="button"
                        onClick={() => setSchemaEditMode("json")}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${schemaEditMode === "json" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-300"
                          }`}
                      >
                        <Code className="h-3.5 w-3.5" />
                        Raw JSON
                      </button>
                    </div>
                  </div>

                  {/* Schema Content area */}
                  <div className="flex-1 min-h-[300px] flex flex-col">
                    {schemaEditMode === "visual" ? (
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-2">
                        {fields.length === 0 ? (
                          <div className="text-center py-10 text-slate-500 text-xs">
                            No fields defined. Click "Add Field" to begin.
                          </div>
                        ) : (
                          fields.map((field, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 bg-slate-950/40 border border-slate-850/40 p-3 rounded-xl hover:border-slate-800 transition"
                            >
                              <div className="text-xs text-slate-600 font-bold w-6">{idx + 1}</div>

                              <div className="flex-1 grid grid-cols-3 gap-3">
                                <div>
                                  <input
                                    type="text"
                                    placeholder="Variable Key (e.g., heroTitle)"
                                    value={field.key}
                                    onChange={(e) => updateFieldProperty(idx, "key", e.target.value.replace(/\s+/g, ""))}
                                    className="w-full bg-slate-950 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    placeholder="Input Label (e.g., Hero Title)"
                                    value={field.label}
                                    onChange={(e) => updateFieldProperty(idx, "label", e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <select
                                    value={field.type}
                                    onChange={(e) => updateFieldProperty(idx, "type", e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none"
                                  >
                                    <option value="text">Single Line Text</option>
                                    <option value="textarea">Paragraph Area</option>
                                    <option value="image">Image Attachment</option>
                                  </select>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeField(idx)}
                                className="p-1.5 text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        )}

                        <button
                          type="button"
                          onClick={addField}
                          className="w-full py-2 bg-slate-950 border border-dashed border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-semibold transition"
                        >
                          + Add Field Section
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col space-y-2">
                        <textarea
                          value={rawJson}
                          onChange={(e) => handleJsonChange(e.target.value)}
                          rows={14}
                          className="w-full flex-1 bg-slate-950 border border-slate-800/80 px-3.5 py-2.5 rounded-xl font-mono text-xs text-emerald-400 focus:outline-none resize-none"
                        />
                        {jsonError && (
                          <div className="flex items-center gap-2 text-rose-400 text-xs mt-1 bg-rose-950/20 border border-rose-500/20 p-2.5 rounded-xl">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{jsonError}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-800/60 flex items-center justify-between bg-slate-900/60">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <div className="flex gap-2">
                  {activeTab === "general" ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("schema")}
                      className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      Next: Layout Schema →
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveTab("general")}
                        className="px-5 py-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 rounded-xl text-xs font-bold transition"
                      >
                        ← Back to Info
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !!jsonError}
                        className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md"
                      >
                        {isSubmitting ? "Saving..." : "Save Template"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          isLoading={isDeleting}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Delete A+ Template"
          message={`Are you sure you want to delete the template "${deleteConfirm.name}"? This action cannot be undone and may affect products linked to it.`}
          confirmText="Yes, Delete"
          iconColor="text-rose-400"
          confirmButtonStyle="bg-rose-600 hover:bg-rose-700"
        />
      )}

      {/* VIEW SAMPLE JSON PREVIEW MODAL */}
      {selectedSampleTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800/60 bg-slate-900">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-violet-400" />
                  Template Preview: {selectedSampleTemplate.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Visualize layout structure and see where mapping keys are placed.</p>
              </div>
              <button onClick={() => setSelectedSampleTemplate(null)} className="text-slate-500 hover:text-slate-300 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs Trigger */}
            <div className="flex border-b border-slate-800/40 px-6 bg-slate-900/50">
              <button
                type="button"
                onClick={() => setPreviewTab("visual")}
                className={`py-3 px-4 text-xs font-bold transition-all border-b-2 ${previewTab === "visual" ? "border-violet-500 text-violet-400" : "border-transparent text-slate-400 hover:text-slate-300"
                  }`}
              >
                1. Live Visual Preview
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("json")}
                className={`py-3 px-4 text-xs font-bold transition-all border-b-2 ${previewTab === "json" ? "border-violet-500 text-violet-400" : "border-transparent text-slate-400 hover:text-slate-300"
                  }`}
              >
                2. JSON Schema & Reference
              </button>
            </div>

            {/* Modal Body: Visual Preview */}
            {previewTab === "visual" && (
              <div className="p-6 flex-1 overflow-y-auto bg-slate-955">
                <div className="bg-slate-100 rounded-2xl p-4 sm:p-6 border border-slate-200/50 shadow-inner">
                  <div className="text-[10px] text-slate-500 font-bold mb-3 tracking-widest uppercase border-b border-slate-200/80 pb-2 flex items-center justify-between">
                    <span>Preview Container (Simulated Client Screen)</span>
                    <span className="text-[10px] text-violet-650 bg-violet-50 px-2 py-0.5 rounded-full font-bold">Labels Mode</span>
                  </div>
                  <div className="aplus-preview-wrapper min-h-[400px]">
                    <TemplateVisualPreview template={selectedSampleTemplate} />
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body: JSON & Fields Reference */}
            {previewTab === "json" && (
              <div className="p-6 flex-1 overflow-y-auto bg-slate-900 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sample A+ Content JSON</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const jsonStr = generateSampleJson(selectedSampleTemplate.sectionsJson);
                        navigator.clipboard.writeText(jsonStr);
                        toast.success("Sample JSON copied to clipboard! 📋");
                      }}
                      className="px-2.5 py-1 bg-violet-600 hover:bg-violet-750 text-[10px] text-white rounded-lg font-bold transition shadow-sm"
                    >
                      Copy JSON
                    </button>
                  </div>
                  <pre className="bg-slate-955 border border-slate-850 p-4 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto max-h-[280px] whitespace-pre-wrap break-all">
                    {generateSampleJson(selectedSampleTemplate.sectionsJson)}
                  </pre>
                </div>

                {/* Table of fields for reference */}
                <div>
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Fields Reference</h4>
                  <div className="border border-slate-800/60 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-850/80 text-slate-400 font-semibold">
                          <th className="p-3">Field Key</th>
                          <th className="p-3">Label</th>
                          <th className="p-3">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/40 text-slate-300">
                        {(() => {
                          try {
                            const fields = JSON.parse(selectedSampleTemplate.sectionsJson || "[]");
                            if (fields.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={3} className="p-3 text-center text-slate-500">No fields defined</td>
                                </tr>
                              );
                            }
                            return fields.map((f: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-955/40 transition">
                                <td className="p-3 font-mono text-violet-400 font-semibold">{f.key}</td>
                                <td className="p-3">{f.label}</td>
                                <td className="p-3 capitalize text-slate-450">{f.type}</td>
                              </tr>
                            ));
                          } catch {
                            return (
                              <tr>
                                <td colSpan={3} className="p-3 text-center text-slate-550">Failed to parse schema</td>
                              </tr>
                            );
                          }
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800/60 flex items-center justify-between bg-slate-900/60">
              <button
                type="button"
                onClick={() => {
                  const jsonStr = generateSampleJson(selectedSampleTemplate.sectionsJson);
                  navigator.clipboard.writeText(jsonStr);
                  toast.success("Sample JSON copied to clipboard! 📋");
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-violet-400 border border-slate-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                Copy Sample JSON
              </button>
              <button
                type="button"
                onClick={() => setSelectedSampleTemplate(null)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 rounded-xl text-xs font-bold transition border border-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
