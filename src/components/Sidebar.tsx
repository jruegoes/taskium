import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";
import { hashPassword } from "../lib/crypto";
import { getVisitedProjects, removeVisitedProject } from "../lib/visitedProjects";
import { nanoid } from "nanoid";
import { Sun, Moon, X, Plus, LogOut, FolderOpen, Lock, Trash2 } from "lucide-react";

interface SidebarProps {
  onClose: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [visited, setVisited] = useState(getVisitedProjects());

  // Refresh visited list when sidebar opens
  useEffect(() => {
    setVisited(getVisitedProjects());
  }, []);

  const handleRemoveVisited = (shareId: string) => {
    removeVisitedProject(shareId);
    setVisited(getVisitedProjects());
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const shareId = nanoid(24);
    const ph = newPassword ? await hashPassword(newPassword) : null;
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: newName.trim(),
        share_id: shareId,
        owner_id: user?.id ?? null,
        password_hash: ph,
      })
      .select()
      .single();

    if (error) {
      alert("Failed to create project: " + error.message);
      return;
    }
    if (data) {
      await supabase.from("columns").insert([
        { project_id: data.id, name: "To Do", color: "#5b9bd5", position: 0 },
        { project_id: data.id, name: "In Progress", color: "#f9d977", position: 1 },
        { project_id: data.id, name: "Done", color: "#a8e6a1", position: 2 },
      ]);
      if (ph) ((window.__taskiumAccess ??= {})[data.share_id] = true);
      setCreating(false);
      setNewName("");
      setNewPassword("");
      setShowPassword(false);
      onClose();
      navigate(`/public/${data.share_id}`);
    }
  };

  return (
    <aside className="h-full w-72 bg-board-bg border-r border-border shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="text-xl font-bold text-text no-underline"
          style={{ fontFamily: "var(--font-logo)" }}
          onClick={onClose}
        >
          Taskium
        </Link>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-hover transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 w-full px-2 py-2 mb-3 rounded-lg hover:bg-hover text-text-muted hover:text-text transition-colors text-sm"
          >
            <Plus size={14} />
            New Project
          </button>
        ) : (
          <div className="space-y-2 px-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Project name..."
              className="w-full border border-border rounded-lg px-3 py-2 bg-card-bg text-text outline-none focus:border-primary text-sm"
              autoFocus
            />
            {showPassword ? (
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password (optional)"
                  className="w-full border border-border rounded-lg px-3 py-2 bg-card-bg text-text outline-none focus:border-primary text-sm pr-16"
                />
                <button
                  onClick={() => { setShowPassword(false); setNewPassword(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text text-xs"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPassword(true)}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
              >
                <Lock size={12} />
                Add password
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 bg-primary text-white rounded-lg px-3 py-1.5 text-sm hover:bg-primary-hover transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => { setCreating(false); setNewName(""); setNewPassword(""); setShowPassword(false); }}
                className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm hover:bg-hover text-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {visited.length > 0 && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider px-2 mb-2">
              My Boards
            </p>
            <ul className="space-y-0.5">
              {visited.map((p) => (
                <li key={p.share_id} className="group flex items-center">
                  <Link
                    to={`/public/${p.share_id}`}
                    onClick={onClose}
                    className="flex items-center gap-2 flex-1 px-2 py-2 rounded-lg hover:bg-hover text-text no-underline truncate text-sm"
                    style={{ fontFamily: "var(--font-logo)" }}
                  >
                    <FolderOpen size={14} className="text-text-muted shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </Link>
                  <button
                    onClick={() => handleRemoveVisited(p.share_id)}
                    className="p-1 rounded text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Remove from list"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border space-y-1">
        {user && (
          <>
            <p className="text-xs text-text-muted truncate px-2 mb-1">{user.email}</p>
            <button
              onClick={async () => { await signOut(); onClose(); }}
              className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-hover text-text-muted hover:text-text transition-colors text-sm"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </>
        )}
        <button
          onClick={toggle}
          className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-hover text-text-muted hover:text-text transition-colors text-sm"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}
