import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { RichEditor } from "./RichEditor";
import { TagPicker } from "./TagPicker";
import { ConfirmModal } from "./ConfirmModal";
import type { Ticket, Column } from "../types";

interface TicketDetailModalProps {
  ticket: Ticket;
  columns: Column[];
  onClose: () => void;
  onUpdated: () => void;
}

export function TicketDetailModal({
  ticket,
  columns,
  onClose,
  onUpdated,
}: TicketDetailModalProps) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description || "");
  const [dueDate, setDueDate] = useState(ticket.due_date || "");
  const [columnId, setColumnId] = useState(ticket.column_id);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>(ticket.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Load existing tags for this ticket
  useEffect(() => {
    supabase
      .from("ticket_tags")
      .select("tag_id")
      .eq("ticket_id", ticket.id)
      .then(({ data }) => {
        if (data) setTagIds(data.map((r) => r.tag_id));
      });
  }, [ticket.id]);

  const createdAt = new Date(ticket.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${ticket.project_id}/${ticket.id}/${crypto.randomUUID()}.${ext}`;
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

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("tickets")
      .update({
        title: title.trim(),
        description: description || null,
        column_id: columnId,
        images,
        due_date: dueDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);
    if (error) {
      alert("Failed to update: " + error.message);
      setSaving(false);
      return;
    }
    // Sync tags: delete all then re-insert
    await supabase.from("ticket_tags").delete().eq("ticket_id", ticket.id);
    if (tagIds.length > 0) {
      await supabase.from("ticket_tags").insert(
        tagIds.map((tag_id) => ({ ticket_id: ticket.id, tag_id }))
      );
    }
    onUpdated();
    onClose();
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("tickets")
      .delete()
      .eq("id", ticket.id);
    if (error) {
      alert("Failed to delete: " + error.message);
      return;
    }
    onUpdated();
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border">
          <div>
            <h2 className="text-xl text-text truncate">{title || "Untitled"}</h2>
            <p className="text-xs text-text-muted mt-0.5">Created {createdAt}</p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-danger hover:bg-hover border border-danger rounded-lg px-3 py-1.5 transition-colors"
          >
            Delete
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full border border-border rounded-lg px-3 py-2 mb-3 bg-board-bg text-text outline-none focus:border-primary"
            autoFocus
          />

          <div className="mb-3">
            <RichEditor
              content={description}
              onChange={setDescription}
              placeholder="Description (optional)..."
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-text-muted mb-1">Column</label>
            <select
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 bg-board-bg text-text outline-none focus:border-primary"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm text-text-muted mb-1">Tags</label>
            <TagPicker
              projectId={ticket.project_id}
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

          <div className="mb-2">
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

        {/* Sticky footer */}
        <div className="flex gap-2 px-6 py-3 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="border border-border rounded-lg px-4 py-2 hover:bg-hover transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Task"
          message="This will permanently delete this task. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

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
