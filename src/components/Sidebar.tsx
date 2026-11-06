import React from "react";
import { useStore } from "../store/useStore";
import {
  Folder,
  FolderOpen,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  FileJson,
  Layers,
  History,
  FolderUp,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const {
    sidebarTab,
    setSidebarTab,
    collections,
    environments,
    history,
    getActiveTab,
    loadSavedRequest,
    createCollection,
    createEnvironment,
    isSidebarOpen,
    saveCurrentRequest,
    exportPostman,
    importPostman,
    openNewTab,
  } = useStore();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [collapsedCols, setCollapsedCols] = React.useState<Record<string, boolean>>({});
  const [newColName, setNewColName] = React.useState("");
  const [isAddingCol, setIsAddingCol] = React.useState(false);
  const uploadInputRef = React.useRef<HTMLInputElement>(null);
  const [isSavingReq, setIsSavingReq] = React.useState<string | null>(null);
  const [saveReqName, setSaveReqName] = React.useState("");

  if (!isSidebarOpen) return null;

  const activeTab = getActiveTab();

  const toggleCollapse = (id: string) => {
    setCollapsedCols((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getMethodBadgeClass = (method: string) => {
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

  const handleCreateCol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newColName.trim()) {
      await createCollection(newColName.trim());
      setNewColName("");
      setIsAddingCol(false);
    }
  };

  const handleSaveReq = async (colId: string) => {
    if (saveReqName.trim()) {
      await saveCurrentRequest(saveReqName.trim(), colId);
      setSaveReqName("");
      setIsSavingReq(null);
    }
  };

  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (content) {
          await importPostman(content);
        }
      };
      reader.readAsText(file);
    }
    // reset input so the same file can be re-selected if needed
    e.target.value = "";
  };

  return (
    <aside className="w-64 bg-[#0e1017]/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col h-full text-xs select-none">
      {/* Dia-style Segmented Pills Tab Switcher */}
      <div className="p-2 border-b border-white/[0.06]">
        <div className="flex rounded-xl bg-white/[0.04] p-1 border border-white/[0.06]">
          <button
            onClick={() => setSidebarTab("collections")}
            className={`flex-1 py-1.5 rounded-lg text-center text-[11px] font-medium transition-all duration-150 cursor-pointer flex items-center justify-center space-x-1.5 ${
              sidebarTab === "collections"
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Folder className="w-3 h-3" />
            <span>Collections</span>
          </button>
          <button
            onClick={() => setSidebarTab("environments")}
            className={`flex-1 py-1.5 rounded-lg text-center text-[11px] font-medium transition-all duration-150 cursor-pointer flex items-center justify-center space-x-1.5 ${
              sidebarTab === "environments"
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Env</span>
          </button>
          <button
            onClick={() => setSidebarTab("history")}
            className={`flex-1 py-1.5 rounded-lg text-center text-[11px] font-medium transition-all duration-150 cursor-pointer flex items-center justify-center space-x-1.5 ${
              sidebarTab === "history"
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <History className="w-3 h-3" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="px-2 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-8 pr-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {/* COLLECTIONS TAB */}
        {sidebarTab === "collections" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] text-zinc-400">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500">
                Collections
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => uploadInputRef.current?.click()}
                  className="hover:text-amber-400 text-zinc-400 transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
                  title="Upload Postman Collection (.json)"
                >
                  <FolderUp className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleDirectFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => setIsAddingCol(true)}
                  className="hover:text-blue-400 text-zinc-400 transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
                  title="New Collection"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isAddingCol && (
              <form onSubmit={handleCreateCol} className="p-2 bg-[#141720] rounded-xl border border-white/[0.08] shadow-lg">
                <input
                  type="text"
                  autoFocus
                  placeholder="Collection name..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-zinc-200 mb-2 focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingCol(false)}
                    className="px-2.5 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-0.5 text-[10px] bg-blue-600 rounded-md text-white font-medium hover:bg-blue-500 shadow-sm"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {collections.map((col) => {
              const isCollapsed = collapsedCols[col.id];
              const filteredRequests = col.requests.filter(
                (r) =>
                  r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.request.url.toLowerCase().includes(searchQuery.toLowerCase())
              );

              return (
                <div key={col.id} className="rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.04]">
                  {/* Collection Header */}
                  <div
                    onClick={() => toggleCollapse(col.id)}
                    className="flex items-center justify-between px-2.5 py-2 hover:bg-white/[0.04] rounded-lg cursor-pointer text-zinc-300 group transition-colors"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-zinc-500" />
                      )}
                      {isCollapsed ? (
                        <Folder className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span className="font-medium truncate text-zinc-200 text-[11px]">{col.name}</span>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Export to Postman Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportPostman(col.id);
                        }}
                        className="p-1 hover:text-amber-400 text-zinc-500 hover:bg-white/10 rounded transition-colors"
                        title="Export as Postman v2.1 Collection JSON"
                      >
                        <FileJson className="w-3 h-3" />
                      </button>

                      {/* Save Active Request Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSavingReq(col.id);
                          setSaveReqName(activeTab.name);
                        }}
                        className="p-1 hover:text-blue-400 text-zinc-500 hover:bg-white/10 rounded transition-colors"
                        title="Save Current Request In This Collection"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Add Request Form */}
                  {isSavingReq === col.id && (
                    <div className="m-2 p-2 bg-[#141720] rounded-xl border border-white/[0.08]">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Request name..."
                        value={saveReqName}
                        onChange={(e) => setSaveReqName(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-zinc-200 mb-1.5 focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => setIsSavingReq(null)}
                          className="px-2 py-0.5 text-[10px] text-zinc-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveReq(col.id)}
                          className="px-2.5 py-0.5 text-[10px] bg-blue-600 rounded-md text-white font-medium hover:bg-blue-500"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Requests list inside collection */}
                  {!isCollapsed && (
                    <div className="px-1.5 pb-1 space-y-0.5">
                      {filteredRequests.map((req) => {
                        const isSelected = activeTab.savedRequestId === req.id;
                        return (
                          <div
                            key={req.id}
                            onClick={() => loadSavedRequest(req)}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? "bg-blue-600/20 text-white border border-blue-500/30 shadow-xs"
                                : "hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <span
                                className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded border ${getMethodBadgeClass(
                                  req.request.method
                                )}`}
                              >
                                {req.request.method}
                              </span>
                              <span className="truncate text-[11px]">{req.name}</span>
                            </div>
                          </div>
                        );
                      })}

                      {filteredRequests.length === 0 && (
                        <div className="px-2 py-1.5 text-[10px] text-zinc-500 italic">
                          No requests in this collection
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ENVIRONMENTS TAB */}
        {sidebarTab === "environments" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] text-zinc-400">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500">
                Variables
              </span>
              <button
                onClick={() => createEnvironment("New Environment")}
                className="hover:text-blue-400 text-zinc-400 p-0.5 rounded hover:bg-white/5"
                title="Create Environment"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {environments.map((env) => (
              <div key={env.id} className="p-2.5 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-zinc-200 text-xs">{env.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {env.variables.length} vars
                  </span>
                </div>

                <div className="space-y-1">
                  {env.variables.map((v, idx) => (
                    <div key={idx} className="flex items-center space-x-1 font-mono text-[10px]">
                      <span className="text-zinc-500">{"{{"}</span>
                      <span className="text-blue-400 font-medium truncate max-w-[70px]">
                        {v.key}
                      </span>
                      <span className="text-zinc-500">{"}}"}</span>
                      <span className="text-zinc-600">=</span>
                      <span className="text-zinc-300 truncate flex-1">{v.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HISTORY TAB */}
        {sidebarTab === "history" && (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Recent Executions
            </div>

            {history.length === 0 && (
              <div className="px-3 py-6 text-center text-zinc-500 text-xs">
                No requests sent yet.
              </div>
            )}

            {history.map((h) => {
              const status = h.response?.status;
              const isOk = status && status >= 200 && status < 300;
              const isErr = status && status >= 400;

              return (
                <div
                  key={h.id}
                  onClick={() => openNewTab(h.request, `History (${h.request.method})`)}
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-white/[0.04] rounded-lg cursor-pointer text-zinc-300 group transition-colors"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded border ${getMethodBadgeClass(
                        h.request.method
                      )}`}
                    >
                      {h.request.method}
                    </span>
                    <span className="truncate text-[11px] font-mono text-zinc-400 group-hover:text-zinc-200">
                      {h.request.url.replace(/^https?:\/\//, "")}
                    </span>
                  </div>

                  {status && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isOk
                          ? "text-emerald-400 bg-emerald-950/40"
                          : isErr
                          ? "text-rose-400 bg-rose-950/40"
                          : "text-zinc-400 bg-zinc-800"
                      }`}
                    >
                      {status}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
