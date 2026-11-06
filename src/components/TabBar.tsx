import React from "react";
import { useStore, TabItem } from "../store/useStore";
import { Plus, X } from "lucide-react";

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTabId, closeTab, openNewTab, updateActiveTabName } =
    useStore();
  const [editingTabId, setEditingTabId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");

  const getMethodBadge = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-500/30";
      case "POST":
        return "text-amber-400 bg-amber-950/60 border-amber-500/30";
      case "PUT":
        return "text-sky-400 bg-sky-950/60 border-sky-500/30";
      case "DELETE":
        return "text-rose-400 bg-rose-950/60 border-rose-500/30";
      case "PATCH":
        return "text-purple-400 bg-purple-950/60 border-purple-500/30";
      default:
        return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  const handleStartRename = (tab: TabItem) => {
    setEditingTabId(tab.id);
    setEditingName(tab.name);
  };

  const handleFinishRename = () => {
    if (editingName.trim()) {
      updateActiveTabName(editingName.trim());
    }
    setEditingTabId(null);
  };

  return (
    <div className="h-10 px-2 bg-[#0d0e13]/80 backdrop-blur-md border-b border-white/[0.06] flex items-center space-x-1 select-none overflow-x-auto z-10">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            onDoubleClick={() => handleStartRename(tab)}
            className={`group relative h-8 px-2.5 rounded-lg flex items-center space-x-2 text-xs cursor-pointer transition-all duration-150 max-w-[200px] border ${
              isActive
                ? "bg-[#181a24] text-white border-white/[0.12] shadow-md shadow-black/40"
                : "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border-transparent"
            }`}
          >
            {/* Method Badge Pill */}
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getMethodBadge(
                tab.request.method
              )}`}
            >
              {tab.request.method}
            </span>

            {/* Tab Title or Inline Edit */}
            {editingTabId === tab.id ? (
              <input
                type="text"
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFinishRename();
                  if (e.key === "Escape") setEditingTabId(null);
                }}
                className="bg-[#101217] border border-blue-500 rounded px-1.5 py-0.5 text-xs text-zinc-100 font-sans focus:outline-none w-24"
              />
            ) : (
              <span className="truncate font-medium text-[11px]">{tab.name}</span>
            )}

            {/* Dirty unsaved dot indicator */}
            {tab.isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 animate-pulse" />
            )}

            {/* Close Tab Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className={`p-0.5 rounded hover:bg-white/10 transition-colors ${
                isActive ? "text-zinc-400 hover:text-zinc-100" : "opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300"
              }`}
              title="Close Tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* New Tab Button */}
      <button
        onClick={() => openNewTab()}
        className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.06] transition-colors cursor-pointer"
        title="Open New Request Tab"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
