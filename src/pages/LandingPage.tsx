import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { hashPassword } from "../lib/crypto";
import { useAuth } from "../context/AuthContext";
import { nanoid } from "nanoid";
import { MenuButton } from "../components/Layout";

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const shareId = nanoid(24);
    const ph = password ? await hashPassword(password) : null;
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: name.trim(),
        share_id: shareId,
        owner_id: user?.id ?? null,
        password_hash: ph,
      })
      .select()
      .single();

    if (error) {
      alert("Failed to create project: " + error.message);
      setLoading(false);
      return;
    }
    if (data) {
      await supabase.from("columns").insert([
        { project_id: data.id, name: "To Do", color: "#5b9bd5", position: 0 },
        { project_id: data.id, name: "In Progress", color: "#f9d977", position: 1 },
        { project_id: data.id, name: "Done", color: "#a8e6a1", position: 2 },
      ]);
      // Store access so creator doesn't get prompted
      if (ph) ((window.__taskiumAccess ??= {})[data.share_id] = true);
      navigate(`/public/${data.share_id}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 relative">
      <div className="absolute top-4 left-4">
        <MenuButton />
      </div>
      <div className="text-center max-w-md w-full">
        <h1 className="text-5xl mb-2 text-text" style={{ fontFamily: "var(--font-logo)" }}>Taskium</h1>
        <p className="text-lg text-text-muted mb-8">
          Simple task boards. No signup needed.
        </p>

        {showInput ? (
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="My awesome project..."
              className="w-full border border-border rounded-xl px-4 py-3 bg-card-bg outline-none focus:border-primary text-lg text-center"
              autoFocus
            />

            {showPassword ? (
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Board password (optional)"
                  className="w-full border border-border rounded-xl px-4 py-3 bg-card-bg outline-none focus:border-primary text-center"
                />
                <button
                  onClick={() => { setShowPassword(false); setPassword(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text text-xs"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPassword(true)}
                className="flex items-center justify-center gap-2 w-full text-sm text-text-muted hover:text-text transition-colors py-1"
              >
                <Lock size={14} />
                Add password protection
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="flex-1 bg-primary text-white rounded-xl px-4 py-3 text-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowInput(false);
                  setName("");
                  setPassword("");
                  setShowPassword(false);
                }}
                className="border border-border rounded-xl px-4 py-3 hover:bg-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="bg-primary text-white rounded-xl px-8 py-3 text-lg hover:bg-primary-hover transition-colors shadow-sm"
          >
            Create a Project
          </button>
        )}

        {!user && (
          <p className="mt-6 text-sm text-text-muted">
            Want to manage multiple projects?{" "}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
