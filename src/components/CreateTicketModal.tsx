import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { RichEditor } from "./RichEditor";
import { TagPicker } from "./TagPicker";
interface CreateTicketModalProps {
  projectId: string;
  columnId: string;
  nextPosition: number;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTicketModal({
  projectId,
  columnId,
  nextPosition,
  onClose,
  onCreated,
}: CreateTicketModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${projectId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("ticket-images")
      .upload(path, file);
    if (error) {
      alert("Image upload failed: " + error.message);
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("ticket-images").getPublicUrl(path);
    setImages((prev) => [...prev, publicUrl]);
    setUploading(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (images.length >= 7) return;
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) uploadImage(file);
        return;
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("tickets").insert({
      project_id: projectId,
      column_id: columnId,
      title: title.trim(),
      description: description || null,
      position: nextPosition,
      images,
      due_date: dueDate || null,
    }).select().single();
    if (error) {
      alert("Failed to create task: " + error.message);
      setSaving(false);
      return;
    }
    // Insert tag associations
    if (data && tagIds.length > 0) {
      await supabase.from("ticket_tags").insert(
        tagIds.map((tag_id) => ({ ticket_id: data.id, tag_id }))
      );
    }
    onCreated();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-overlay z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card-bg border border-border rounded-xl w-[70vw] max-h-[95vh] shadow-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onPaste={handlePaste}
      >
        <div className="px-6 py-3 border-b border-border">
          <h2 className="text-xl text-text">New Task</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey && handleSubmit()
          }
          placeholder="Task title..."
          className="w-full border border-border rounded-lg px-3 py-2 mb-3 bg-board-bg text-text outline-none focus:border-primary"
          autoFocus
        />

        <div className="mb-3">
          <RichEditor
            content=""
            onChange={setDescription}
            placeholder="Description (optional)..."
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm text-text-muted mb-1">Tags</label>
          <TagPicker
            projectId={projectId}
            selectedTagIds={tagIds}
            onChange={setTagIds}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm text-text-muted mb-1">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 bg-board-bg text-text outline-none focus:border-primary"
          />
        </div>

        <div className="mb-4">
          <div className="flex gap-2 flex-wrap items-center">
            {images.map((url, i) => (
              <div key={i} className="relative group">
                <img
                  src={url}
                  alt={`Attachment ${i + 1}`}
                  className="rounded-lg h-24 w-24 object-cover cursor-zoom-in border border-border"
                  onClick={() => setLightboxUrl(url)}
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 bg-card-bg rounded-full w-5 h-5 text-xs border border-border hover:bg-hover opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
            {images.length < 7 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-24 w-24 flex items-center justify-center text-xs text-center text-text-muted hover:text-text border-2 border-dashed border-border rounded-lg hover:bg-hover transition-colors leading-tight px-1"
              >
                {uploading ? "Uploading..." : "Paste or click to add"}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  Array.from(files).forEach((file) => uploadImage(file));
                }
              }}
            />
          </div>
        </div>
        </div>

        <div className="flex gap-2 px-6 py-3 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="flex-1 bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Task"}
          </button>
          <button
            onClick={onClose}
            className="border border-border rounded-lg px-4 py-2 hover:bg-hover transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-overlay z-[60] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
            className="absolute top-4 right-4 z-[70] bg-card-bg rounded-full w-8 h-8 text-lg border border-border hover:bg-hover flex items-center justify-center"
          >
            ✕
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
