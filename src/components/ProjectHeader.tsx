import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Share2, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { MenuButton } from "./Layout";
import { ConfirmModal } from "./ConfirmModal";
import type { Project } from "../types";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [name, setName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOwner = user && project.owner_id === user.id;
  const canDelete = isOwner || !project.owner_id;

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/public/${project.share_id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);
    if (error) {
      alert("Failed to delete: " + error.message);
      return;
    }
    navigate("/");
  };

  const handleRename = async () => {
    if (!name.trim() || name.trim() === project.name) {
      setName(project.name);
      setEditing(false);
      return;
    }
    await supabase
      .from("projects")
      .update({ name: name.trim() })
      .eq("id", project.id);
    setEditing(false);
  };

  return (
    <header className="flex items-center gap-4 px-5 py-3">
      <MenuButton />

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") { setName(project.name); setEditing(false); }
          }}
          className="text-2xl text-text bg-transparent border-b-2 border-primary outline-none flex-1 min-w-0"
          autoFocus
        />
      ) : (
        <h1
          className="text-2xl text-text truncate flex-1 cursor-pointer hover:opacity-70 transition-opacity"
          onClick={() => setEditing(true)}
          title="Click to rename"
        >
          {name}
        </h1>
      )}

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm hover:bg-hover transition-colors bg-card-bg"
        >
          <Share2 size={14} />
          {copied ? "Copied!" : "Share"}
        </button>
        {canDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 border border-danger rounded-lg px-3 py-1.5 text-sm text-danger hover:bg-hover transition-colors bg-card-bg"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Project"
          message="This will permanently delete this project and all its tickets. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </header>
  );
}
