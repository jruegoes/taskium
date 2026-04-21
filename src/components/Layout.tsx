import { useState, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { PanelLeftOpen } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { StarGrid } from "./StarGrid";

const LayoutContext = createContext<() => void>(() => {});
export const useOpenSidebar = () => useContext(LayoutContext);

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen relative">
      <StarGrid />

      <div
        className={`sidebar-overlay ${sidebarOpen ? "sidebar-overlay--open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={`sidebar-panel ${sidebarOpen ? "sidebar-panel--open" : ""}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <LayoutContext.Provider value={() => setSidebarOpen(true)}>
        <main>{children}</main>
      </LayoutContext.Provider>
    </div>
  );
}

export function MenuButton() {
  const openSidebar = useOpenSidebar();
  return (
    <button
      onClick={openSidebar}
      className="flex items-center justify-center w-10 h-10 rounded-lg bg-card-bg border border-border hover:bg-hover transition-colors shadow-sm shrink-0"
      aria-label="Open sidebar"
    >
      <PanelLeftOpen size={20} />
    </button>
  );
}
