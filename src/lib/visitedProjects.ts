const KEY = "taskium-visited";

export interface VisitedProject {
  share_id: string;
  name: string;
  visited_at: number;
}

export function getVisitedProjects(): VisitedProject[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveVisitedProject(shareId: string, name: string) {
  const projects = getVisitedProjects().filter((p) => p.share_id !== shareId);
  projects.unshift({ share_id: shareId, name, visited_at: Date.now() });
  // Keep max 20
  localStorage.setItem(KEY, JSON.stringify(projects.slice(0, 20)));
}

export function removeVisitedProject(shareId: string) {
  const projects = getVisitedProjects().filter((p) => p.share_id !== shareId);
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function updateVisitedProjectName(shareId: string, name: string) {
  const projects = getVisitedProjects().map((p) =>
    p.share_id === shareId ? { ...p, name } : p
  );
  localStorage.setItem(KEY, JSON.stringify(projects));
}
