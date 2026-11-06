import React from "react";
import { useStore } from "./store/useStore";
import { Header } from "./components/Header";
import { TabBar } from "./components/TabBar";
import { Sidebar } from "./components/Sidebar";
import { RequestPanel } from "./components/RequestPanel";
import { ResponsePanel } from "./components/ResponsePanel";
import { CommandPalette } from "./components/CommandPalette";
import { ImportModal } from "./components/ImportModal";
import { PanelLeftClose, PanelLeft, GitBranch, Cpu } from "lucide-react";
import "./App.css";

export function App() {
  const { initWorkspace, isSidebarOpen, toggleSidebar } = useStore();

  React.useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-[#0a0b10] via-[#0d0f15] to-[#0a0b10] text-zinc-100 overflow-hidden font-sans">
      {/* Top Header (Dia floating command island) */}
      <Header />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Workbench (TabBar + Request + Response) */}
        <main className="flex-1 flex flex-col overflow-hidden bg-black/10">
          {/* Dia-style Multi-Request Tab Strip */}
          <TabBar />

          {/* Workbench Split Panels */}
          <div className="flex-1 flex overflow-hidden">
            {/* Request Configurator */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-white/[0.06]">
              <RequestPanel />
            </div>

            {/* Response Inspector */}
            <div className="flex-1 flex flex-col min-w-0">
              <ResponsePanel />
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-6 bg-[#0a0c10]/95 backdrop-blur-md border-t border-white/[0.06] flex items-center justify-between px-3 text-[11px] text-zinc-500 font-mono select-none z-10">
        <div className="flex items-center space-x-3">
          {/* Toggle Sidebar Button */}
          <button
            onClick={toggleSidebar}
            className="flex items-center space-x-1 hover:text-zinc-300 transition-colors cursor-pointer"
            title="Toggle Sidebar (Ctrl+B)"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeft className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px]">{isSidebarOpen ? "Hide Panel" : "Show Panel"}</span>
          </button>

          <div className="h-3 w-[1px] bg-white/[0.08]" />

          <div className="flex items-center space-x-1.5 text-zinc-400">
            <GitBranch className="w-3 h-3 text-blue-400" />
            <span className="text-[10px]">main</span>
          </div>

          <div className="flex items-center space-x-1.5 text-zinc-500">
            <span>Offline-First Postman v2.1 Sync</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[10px]">
          <div className="flex items-center space-x-1 text-emerald-400">
            <Cpu className="w-3 h-3" />
            <span>Rust Core • ~32MB RAM</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">UTF-8</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">HTTP/2</span>
        </div>
      </footer>

      {/* Overlays */}
      <CommandPalette />
      <ImportModal />
    </div>
  );
}

export default App;
