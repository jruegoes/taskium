import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { hashPassword } from "../lib/crypto";
import { saveVisitedProject } from "../lib/visitedProjects";
import { ProjectHeader } from "../components/ProjectHeader";
import { KanbanBoard } from "../components/KanbanBoard";
import type { Project, Ticket, Column } from "../types";

export function ProjectPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [wrongPassword, setWrongPassword] = useState(false);

  const fetchColumns = useCallback(async (projectId: string) => {
    const { data } = await supabase
      .from("columns")
      .select("*")
      .eq("project_id", projectId)
      .order("position");
    if (data) setColumns(data);
  }, []);

  const fetchTickets = useCallback(async (projectId: string) => {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("project_id", projectId)
      .order("position");
    if (data) setTickets(data);
  }, []);

  useEffect(() => {
    if (!shareId) return;

    const load = async () => {
      const { data, error: err } = await supabase
        .from("projects")
        .select("*")
        .eq("share_id", shareId)
        .single();

      if (err || !data) {
        setError("Project not found");
        setLoading(false);
        return;
      }

      setProject(data);

      // Check password protection
      if (data.password_hash && !window.__taskiumAccess?.[shareId!]) {
        setLocked(true);
        setLoading(false);
        return;
      }

      saveVisitedProject(data.share_id, data.name);
      await Promise.all([fetchColumns(data.id), fetchTickets(data.id)]);
      setLoading(false);
    };

    load();
  }, [shareId, fetchColumns, fetchTickets]);

  const handleUnlock = async () => {
    if (!project || !passwordInput) return;
    const hash = await hashPassword(passwordInput);
    if (hash === project.password_hash) {
      ((window.__taskiumAccess ??= {})[shareId!] = true);
      saveVisitedProject(project.share_id, project.name);
      setLocked(false);
      setLoading(true);
      await Promise.all([fetchColumns(project.id), fetchTickets(project.id)]);
      setLoading(false);
    } else {
      setWrongPassword(true);
    }
  };

  // Realtime subscription for tickets
  useEffect(() => {
    if (!project || locked) return;

    const channel = supabase
      .channel(`tickets:${project.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTickets((prev) => {
              if (prev.some((t) => t.id === (payload.new as Ticket).id))
                return prev;
              return [...prev, payload.new as Ticket];
            });
          } else if (payload.eventType === "UPDATE") {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Ticket).id
                  ? (payload.new as Ticket)
                  : t
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTickets((prev) =>
              prev.filter((t) => t.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project, locked]);

  // Realtime subscription for columns
  useEffect(() => {
    if (!project || locked) return;

    const channel = supabase
      .channel(`columns:${project.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "columns",
          filter: `project_id=eq.${project.id}`,
        },
        () => {
          fetchColumns(project.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project, locked, fetchColumns]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-text-muted">Loading...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-text mb-2">Project not found</p>
          <a href="/" className="text-primary hover:underline">
            Go home
          </a>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-sm w-full">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-card-bg border border-border flex items-center justify-center">
              <Lock size={28} className="text-text-muted" />
            </div>
          </div>
          <h1 className="text-2xl text-text mb-2">This board is protected</h1>
          <p className="text-sm text-text-muted mb-6">
            Enter the password to access this project.
          </p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setWrongPassword(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Password"
            className="w-full border border-border rounded-xl px-4 py-3 bg-card-bg outline-none focus:border-primary text-center mb-3"
            autoFocus
          />
          {wrongPassword && (
            <p className="text-danger text-sm mb-3">Wrong password. Try again.</p>
          )}
          <button
            onClick={handleUnlock}
            disabled={!passwordInput}
            className="w-full bg-primary text-white rounded-xl px-4 py-3 hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    fetchTickets(project.id);
    fetchColumns(project.id);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <ProjectHeader project={project} />
      <KanbanBoard
        projectId={project.id}
        columns={columns}
        tickets={tickets}
        setTickets={setTickets}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
