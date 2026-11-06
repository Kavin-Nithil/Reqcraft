import React from "react";
import { useStore } from "../store/useStore";
import {
  Folder,
  FolderOpen,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const {
    sidebarTab,
    setSidebarTab,
    collections,
    environments,
    history,
    activeRequestId,
    loadSavedRequest,
    createCollection,
    createEnvironment,
    isSidebarOpen,
    saveCurrentRequest,
  } = useStore();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [collapsedCols, setCollapsedCols] = React.useState<Record<string, boolean>>({});
  const [newColName, setNewColName] = React.useState("");
  const [isAddingCol, setIsAddingCol] = React.useState(false);
  const [isSavingReq, setIsSavingReq] = React.useState<string | null>(null); // collection id
  const [saveReqName, setSaveReqName] = React.useState("");

  if (!isSidebarOpen) return null;

  const toggleCollapse = (id: string) => {
    setCollapsedCols((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "text-emerald-400 bg-emerald-950/40 border-emerald-800/40";
      case "POST":
        return "text-amber-400 bg-amber-950/40 border-amber-800/40";
      case "PUT":
        return "text-sky-400 bg-sky-950/40 border-sky-800/40";
      case "DELETE":
        return "text-rose-400 bg-rose-950/40 border-rose-800/40";
      case "PATCH":
        return "text-purple-400 bg-purple-950/40 border-purple-800/40";
      default:
        return "text-zinc-400 bg-zinc-900 border-zinc-700";
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

  return (
    <aside className="w-64 bg-[#111317] border-r border-[#232730] flex flex-col h-full text-xs select-none">
      {/* Sidebar Tabs */}
      <div className="flex items-center border-b border-[#232730] bg-[#14171d]">
        <button
          onClick={() => setSidebarTab("collections")}
          className={`flex-1 py-2 text-center text-[11px] font-medium border-b-2 cursor-pointer transition-colors ${
            sidebarTab === "collections"
              ? "text-blue-400 border-blue-500 bg-[#171a22]"
              : "text-zinc-400 border-transparent hover:text-zinc-200"
          }`}
        >
          Collections
        </button>
        <button
          onClick={() => setSidebarTab("environments")}
          className={`flex-1 py-2 text-center text-[11px] font-medium border-b-2 cursor-pointer transition-colors ${
            sidebarTab === "environments"
              ? "text-blue-400 border-blue-500 bg-[#171a22]"
              : "text-zinc-400 border-transparent hover:text-zinc-200"
          }`}
        >
          Env
        </button>
        <button
          onClick={() => setSidebarTab("history")}
          className={`flex-1 py-2 text-center text-[11px] font-medium border-b-2 cursor-pointer transition-colors ${
            sidebarTab === "history"
              ? "text-blue-400 border-blue-500 bg-[#171a22]"
              : "text-zinc-400 border-transparent hover:text-zinc-200"
          }`}
        >
          History
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-2 border-b border-[#232730]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181b22] border border-[#272c38] rounded pl-8 pr-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {/* COLLECTIONS TAB */}
        {sidebarTab === "collections" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] text-zinc-400">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500">
                Workspace Collections
              </span>
              <button
                onClick={() => setIsAddingCol(true)}
                className="hover:text-blue-400 text-zinc-400 transition-colors cursor-pointer"
                title="New Collection"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isAddingCol && (
              <form onSubmit={handleCreateCol} className="p-1.5 bg-[#171a22] rounded border border-[#272c38]">
                <input
                  type="text"
                  autoFocus
                  placeholder="Collection name..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full bg-[#101217] border border-[#2b303c] rounded px-2 py-1 text-xs text-zinc-200 mb-1 focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end space-x-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingCol(false)}
                    className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-0.5 text-[10px] bg-blue-600 rounded text-white font-medium hover:bg-blue-500"
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
                <div key={col.id} className="rounded overflow-hidden">
                  {/* Collection Header */}
                  <div
                    onClick={() => toggleCollapse(col.id)}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-[#181b22] rounded cursor-pointer text-zinc-300 group"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
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
                      <span className="font-medium truncate text-zinc-200">{col.name}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSavingReq(col.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-blue-400 text-zinc-500 transition-opacity"
                      title="Save Current Request Here"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Add Request Form */}
                  {isSavingReq === col.id && (
                    <div className="ml-5 p-1.5 bg-[#171a22] rounded border border-[#272c38] my-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Request name..."
                        value={saveReqName}
                        onChange={(e) => setSaveReqName(e.target.value)}
                        className="w-full bg-[#101217] border border-[#2b303c] rounded px-2 py-0.5 text-xs text-zinc-200 mb-1 focus:outline-none focus:border-blue-500"
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
                          className="px-2 py-0.5 text-[10px] bg-blue-600 rounded text-white"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Requests list inside collection */}
                  {!isCollapsed && (
                    <div className="ml-3 pl-2 border-l border-[#232730] space-y-0.5 mt-0.5">
                      {filteredRequests.map((req) => {
                        const isSelected = activeRequestId === req.id;
                        return (
                          <div
                            key={req.id}
                            onClick={() => loadSavedRequest(req)}
                            className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-[#1c202a] text-white border border-[#2b303c]"
                                : "hover:bg-[#161820] text-zinc-400 hover:text-zinc-200"
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
                        <div className="px-2 py-1 text-[10px] text-zinc-500 italic">
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
                className="hover:text-blue-400 text-zinc-400"
                title="Create Environment"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {environments.map((env) => (
              <div key={env.id} className="p-2 bg-[#161920] rounded border border-[#232730]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-zinc-200">{env.name}</span>
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
                  onClick={() => {
                    useStore.getState().setRequest(() => ({ ...h.request }));
                    if (h.response) {
                      useStore.setState({ response: h.response });
                    }
                  }}
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-[#181b22] rounded cursor-pointer text-zinc-300 group"
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
                      className={`text-[9px] font-mono font-bold px-1 rounded ${
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
