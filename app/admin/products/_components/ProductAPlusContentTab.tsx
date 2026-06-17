import { useState, useEffect } from "react";
import { aplusTemplatesService, APlusTemplate, APlusTemplateField } from "@/lib/services/aplusTemplates";
import { uploadEditorImage } from "@/lib/services/editorService";
import { useToast } from "@/app/admin/_components/CustomToast";
import { Sparkles, Layout, X, Upload, ImageIcon, HelpCircle } from "lucide-react";

interface ProductAPlusContentTabProps {
  aPlusTemplateId: string | null;
  aPlusContent: string | null;
  onChange: (templateId: string | null, contentJson: string | null) => void;
}

export default function ProductAPlusContentTab({
  aPlusTemplateId,
  aPlusContent,
  onChange,
}: ProductAPlusContentTabProps) {
  const toast = useToast();
  const [templates, setTemplates] = useState<APlusTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<APlusTemplate | null>(null);
  const [contentValues, setContentValues] = useState<Record<string, string>>({});
  const [uploadingFieldKey, setUploadingFieldKey] = useState<string | null>(null);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const res = await aplusTemplatesService.getAll({ includeInactive: false });
        if (res.data?.success) {
          const activeTemplates = res.data.data || [];
          setTemplates(activeTemplates);
          
          // Match selected template
          if (aPlusTemplateId) {
            const matched = activeTemplates.find((t) => t.id === aPlusTemplateId);
            if (matched) {
              setSelectedTemplate(matched);
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to load templates", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [aPlusTemplateId]);

  // Load and parse content values
  useEffect(() => {
    if (aPlusContent) {
      try {
        const parsed = JSON.parse(aPlusContent);
        if (parsed && typeof parsed === "object") {
          setContentValues(parsed);
          return;
        }
      } catch {}
    }
    setContentValues({});
  }, [aPlusContent]);

  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    if (!templateId) {
      setSelectedTemplate(null);
      onChange(null, null);
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    // Warning about losing data
    if (selectedTemplate && selectedTemplate.id !== templateId) {
      const confirmChange = window.confirm(
        "Changing layout template may hide or reset some inputs. Do you want to proceed?"
      );
      if (!confirmChange) return;
    }

    setSelectedTemplate(template);
    
    // Parse template fields and retain matching values
    let templateFields: APlusTemplateField[] = [];
    try {
      templateFields = JSON.parse(template.sectionsJson);
    } catch {}

    const newValues: Record<string, string> = {};
    templateFields.forEach((field) => {
      newValues[field.key] = contentValues[field.key] || "";
    });

    setContentValues(newValues);
    onChange(templateId, JSON.stringify(newValues));
  };

  // Handle value changes
  const handleValueChange = (key: string, value: string) => {
    const updated = { ...contentValues, [key]: value };
    setContentValues(updated);
    onChange(aPlusTemplateId, JSON.stringify(updated));
  };

  // Handle local image upload for dynamic image fields
  const handleImageUpload = async (key: string, file: File) => {
    setUploadingFieldKey(key);
    try {
      const res = await uploadEditorImage(file);
      if (res.location) {
        handleValueChange(key, res.location);
        toast.success("Image uploaded successfully! 🖼️");
      }
    } catch (err: any) {
      toast.error(err.message || "Image upload failed");
    } finally {
      setUploadingFieldKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-2 text-slate-400">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500" />
        <p className="text-xs">Loading templates list...</p>
      </div>
    );
  }

  // Parse fields if template is selected
  let fields: APlusTemplateField[] = [];
  if (selectedTemplate) {
    try {
      fields = JSON.parse(selectedTemplate.sectionsJson);
    } catch {}
  }

  return (
    <div className="space-y-6 text-slate-200">
      {/* Template Selector Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h3 className="text-md font-semibold text-slate-100">Select A+ Content Template</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Choose a design layout template from your A+ Template Library. You can then fill out the custom specifications, banners, FAQ tabs, and detailed features.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs text-slate-400 font-semibold mb-1">Layout Template</label>
            <select
              value={aPlusTemplateId || ""}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850/60 px-3.5 py-2 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="">-- No A+ Content / Disabled --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <div className="bg-slate-950/60 border border-slate-850/40 p-3 rounded-xl flex items-center gap-3">
              <div className="w-16 h-10 bg-slate-900 border border-slate-800 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                {selectedTemplate.thumbnailUrl ? (
                  <img
                    src={selectedTemplate.thumbnailUrl}
                    alt={selectedTemplate.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Layout className="h-4 w-4 text-slate-700" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">{selectedTemplate.name}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{selectedTemplate.description || "No description."}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Content Form */}
      {selectedTemplate ? (
        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-850/60 pb-3">
            <h3 className="text-sm font-bold text-slate-200">Layout Section Values</h3>
            <span className="text-[10px] bg-violet-950/40 text-violet-400 border border-violet-800/30 px-2 py-0.5 rounded-full font-medium">
              {fields.length} Configurable Inputs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fields.map((field) => {
              const value = contentValues[field.key] || "";

              return (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    {field.label} <span className="text-[10px] text-slate-600 font-normal">({field.key})</span>
                  </label>

                  {field.type === "text" && (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleValueChange(field.key, e.target.value)}
                      placeholder={`Enter text details...`}
                      className="w-full bg-slate-950 border border-slate-800/80 px-3.5 py-2 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      value={value}
                      onChange={(e) => handleValueChange(field.key, e.target.value)}
                      placeholder={`Enter description paragraph...`}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800/80 px-3.5 py-2 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500 resize-none"
                    />
                  )}

                  {field.type === "image" && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleValueChange(field.key, e.target.value)}
                          placeholder={`Paste direct image URL...`}
                          className="flex-1 bg-slate-950 border border-slate-800/80 px-3.5 py-2 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                        />
                        <div className="relative">
                          <input
                            type="file"
                            id={`file-${field.key}`}
                            accept="image/*"
                            disabled={uploadingFieldKey === field.key}
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(field.key, e.target.files[0])}
                            className="hidden"
                          />
                          <label
                            htmlFor={`file-${field.key}`}
                            className="h-full flex items-center justify-center px-4 py-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition disabled:opacity-50"
                          >
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            {uploadingFieldKey === field.key ? "Uploading..." : "Upload"}
                          </label>
                        </div>
                      </div>

                      {/* Image Preview Box */}
                      {value && (value.startsWith("http") || value.startsWith("/")) && (
                        <div className="relative w-24 h-16 bg-slate-950 border border-slate-850/60 rounded-lg overflow-hidden flex items-center justify-center">
                          <img
                            src={value}
                            alt="preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/placeholder-product.png";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleValueChange(field.key, "")}
                            className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-slate-400 hover:text-white"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/10 border border-dashed border-slate-850/60 rounded-2xl">
          <Layout className="h-10 w-10 text-slate-800 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-xs">A+ Content is currently disabled</p>
          <p className="text-slate-500 text-[10px] mt-1">Select a template from the dropdown selection above to configure custom details.</p>
        </div>
      )}
    </div>
  );
}
