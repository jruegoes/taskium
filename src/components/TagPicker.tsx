import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { Tag } from "../types";

const PRESET_COLORS = [
  "#5b9bd5", "#e57373", "#f9d977", "#a8e6a1",
  "#ce93d8", "#ffb74d", "#4dd0e1", "#90a4ae",
];

interface TagPickerProps {
  projectId: string;
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({ projectId, selectedTagIds, onChange }: TagPickerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTags();
  }, [projectId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadTags = async () => {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .eq("project_id", projectId)
      .order("name");
    if (data) setTags(data);
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase
      .from("tags")
      .insert({ project_id: projectId, name: newName.trim(), color: newColor })
      .select()
      .single();
    if (error) {
      alert("Failed to create tag: " + error.message);
      return;
    }
    if (data) {
      setTags((prev) => [...prev, data]);
      onChange([...selectedTagIds, data.id]);
      setNewName("");
      setCreating(false);
    }
  };

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));

  return (
    <div ref={ref} className="relative">
      <div
        className="flex flex-wrap gap-1.5 min-h-[38px] border border-border rounded-lg px-3 py-2 bg-board-bg cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))
        ) : (
          <span className="text-text-muted text-sm">Select tags...</span>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card-bg border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-hover transition-colors text-left"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-sm text-text flex-1">{tag.name}</span>
              {selectedTagIds.includes(tag.id) && (
                <span className="text-primary text-sm">✓</span>
              )}
            </button>
          ))}

          {creating ? (
            <div className="p-3 border-t border-border space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Tag name..."
                className="w-full border border-border rounded px-2 py-1 text-sm bg-board-bg text-text outline-none focus:border-primary"
                autoFocus
              />
              <div className="flex gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${newColor === c ? "border-text" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex-1 bg-primary text-white rounded px-2 py-1 text-sm hover:bg-primary-hover transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setCreating(false); setNewName(""); }}
                  className="flex-1 border border-border rounded px-2 py-1 text-sm hover:bg-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="w-full px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-hover transition-colors border-t border-border text-left"
            >
              + Create new tag
            </button>
          )}
        </div>
      )}
    </div>
  );
}
