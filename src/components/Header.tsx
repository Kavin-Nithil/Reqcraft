import React from "react";
import { useStore } from "../store/useStore";
import {
  Layers,
  Sparkles,
  Command,
  Download,
  Upload,
  Check,
  ChevronDown,
  Terminal,
  FileJson,
} from "lucide-react";

export const Header: React.FC = () => {
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironmentId,
    setCommandPaletteOpen,
    setImportModalOpen,
    exportCurl,
    getActiveTab,
    collections,
    exportPostman,
    exportWorkspace,
  } = useStore();

  const [copied, setCopied] = React.useState(false);
  const [showEnvDropdown, setShowEnvDropdown] = React.useState(false);
  const [showExportDropdown, setShowExportDropdown] = React.useState(false);

  const activeTab = getActiveTab();
  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);

  const handleCopyCurl = async () => {
    try {
      const curl = await exportCurl();
      await navigator.clipboard.writeText(curl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-11 bg-[#0c0d12]/90 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-3 text-xs select-none z-20">
      {/* Left: App Logo & Active Request Name */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 font-semibold text-white tracking-wide">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Reqcraft
          </span>
          <span className="text-[10px] text-zinc-500 font-mono font-normal px-1.5 py-0.2 rounded-full bg-white/[0.04] border border-white/[0.06]">
            v0.1.0
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-white/[0.08]" />

        <div className="flex items-center space-x-1.5 text-zinc-400 font-mono text-[11px] truncate max-w-xs">
          <span className="text-zinc-600">tab/</span>
          <span className="text-zinc-200 truncate">{activeTab.name}</span>
        </div>
      </div>

      {/* Middle: Dia-Style Pill Command Bar */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-zinc-400 hover:text-zinc-100 transition-all duration-150 cursor-pointer shadow-inner"
        title="Open Command Palette (Ctrl+P or Cmd+K)"
      >
        <Command className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[11px] font-sans">Search requests, collections, history...</span>
        <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
          ⌘K
        </kbd>
      </button>

      {/* Right: Environment, Import, Export Postman & Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Environment Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowEnvDropdown(!showEnvDropdown)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Layers className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] max-w-[100px] truncate">
              {activeEnv ? activeEnv.name : "No Environment"}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {showEnvDropdown && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-[#14161f] border border-white/[0.08] shadow-2xl py-1 z-50 backdrop-blur-xl">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                Active Environment
              </div>
              <button
                onClick={() => {
                  setActiveEnvironmentId(null);
                  setShowEnvDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-white/[0.06] ${
                  activeEnvironmentId === null ? "text-blue-400 font-medium" : "text-zinc-400"
                }`}
              >
                <span>No Environment</span>
                {activeEnvironmentId === null && <Check className="w-3 h-3 text-blue-400" />}
              </button>
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => {
                    setActiveEnvironmentId(env.id);
                    setShowEnvDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-white/[0.06] ${
                    activeEnvironmentId === env.id ? "text-blue-400 font-medium" : "text-zinc-300"
                  }`}
                >
                  <span className="truncate">{env.name}</span>
                  {activeEnvironmentId === env.id && <Check className="w-3 h-3 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export Dropdown (Postman / Workspace JSON) */}
        <div className="relative">
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Export to Postman or Workspace JSON"
          >
            <Upload className="w-3 h-3 text-indigo-400" />
            <span className="text-[11px]">Export</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {showExportDropdown && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-[#14161f] border border-white/[0.08] shadow-2xl py-1 z-50 backdrop-blur-xl">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                Export to Postman v2.1
              </div>
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => {
                    exportPostman(col.id);
                    setShowExportDropdown(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                >
                  <FileJson className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{col.name}.json</span>
                </button>
              ))}

              <div className="h-[1px] bg-white/[0.06] my-1" />

              <button
                onClick={() => {
                  exportWorkspace();
                  setShowExportDropdown(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white"
              >
                <Download className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>Export Full Workspace JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Copy as cURL */}
        <button
          onClick={handleCopyCurl}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
          title="Copy active request as cURL command"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Terminal className="w-3 h-3 text-zinc-400" />
              <span className="text-[11px]">cURL</span>
            </>
          )}
        </button>

        {/* Import Modal Button */}
        <button
          onClick={() => setImportModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer font-medium"
          title="Import from Postman collection or cURL"
        >
          <Download className="w-3 h-3" />
          <span className="text-[11px]">Import</span>
        </button>
      </div>
    </header>
  );
};
