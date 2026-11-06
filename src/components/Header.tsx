import React from "react";
import { useStore } from "../store/useStore";
import {
  Layers,
  Sparkles,
  Command,
  Download,
  Check,
  ChevronDown,
  Terminal,
} from "lucide-react";

export const Header: React.FC = () => {
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironmentId,
    setCommandPaletteOpen,
    setImportModalOpen,
    exportCurl,
    activeRequestName,
  } = useStore();

  const [copied, setCopied] = React.useState(false);
  const [showEnvDropdown, setShowEnvDropdown] = React.useState(false);

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
    <header className="h-10 bg-[#12141a] border-b border-[#232730] flex items-center justify-between px-3 text-xs select-none z-20">
      {/* Left: App Logo & Active Request Name */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 font-semibold text-[#f0f2f5] tracking-wide">
          <div className="w-5 h-5 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Sparkles className="w-3 h-3" />
          </div>
          <span>Reqcraft</span>
          <span className="text-[10px] text-zinc-500 font-mono font-normal">v0.1.0</span>
        </div>

        <div className="h-3 w-[1px] bg-[#2b303c]" />

        <div className="flex items-center space-x-1.5 text-zinc-400 font-mono text-[11px] truncate max-w-xs">
          <span className="text-zinc-600">request/</span>
          <span className="text-zinc-200 truncate">{activeRequestName}</span>
        </div>
      </div>

      {/* Middle: Command Palette Quick Trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center space-x-2 px-3 py-1 rounded bg-[#181b22] hover:bg-[#20242e] border border-[#272c38] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        title="Open Command Palette (Ctrl+P or Cmd+K)"
      >
        <Command className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[11px]">Search requests, collections, history...</span>
        <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#111318] text-zinc-500 border border-[#2b303c]">
          ⌘K
        </kbd>
      </button>

      {/* Right: Environment Selector & Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Environment Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowEnvDropdown(!showEnvDropdown)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#181b22] hover:bg-[#20242e] border border-[#272c38] text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Layers className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] max-w-[100px] truncate">
              {activeEnv ? activeEnv.name : "No Environment"}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {showEnvDropdown && (
            <div className="absolute right-0 mt-1.5 w-44 rounded-md bg-[#161920] border border-[#272c38] shadow-2xl py-1 z-50">
              <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                Environments
              </div>
              <button
                onClick={() => {
                  setActiveEnvironmentId(null);
                  setShowEnvDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1 text-left text-xs hover:bg-[#20242e] ${
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
                  className={`w-full flex items-center justify-between px-2.5 py-1 text-left text-xs hover:bg-[#20242e] ${
                    activeEnvironmentId === env.id
                      ? "text-blue-400 font-medium"
                      : "text-zinc-300"
                  }`}
                >
                  <span className="truncate">{env.name}</span>
                  {activeEnvironmentId === env.id && (
                    <Check className="w-3 h-3 text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Copy as cURL */}
        <button
          onClick={handleCopyCurl}
          className="flex items-center space-x-1.5 px-2 py-1 rounded bg-[#181b22] hover:bg-[#20242e] border border-[#272c38] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Copy current request as cURL command"
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

        {/* Import Postman / cURL */}
        <button
          onClick={() => setImportModalOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 transition-colors cursor-pointer"
          title="Import from Postman collection or cURL"
        >
          <Download className="w-3 h-3" />
          <span className="text-[11px] font-medium">Import</span>
        </button>
      </div>
    </header>
  );
};
