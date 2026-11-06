import React from "react";
import { useStore } from "../store/useStore";
import {
  Send,
  Loader2,
  Plus,
  Trash2,
  Code2,
  Lock,
  FileText,
  Sliders,
} from "lucide-react";
import { KeyValue } from "../types";

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

export const RequestPanel: React.FC = () => {
  const {
    request,
    setRequest,
    updateMethod,
    updateUrl,
    requestTab,
    setRequestTab,
    isLoading,
    executeActiveRequest,
  } = useStore();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      executeActiveRequest();
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "text-emerald-400 bg-emerald-950/40 border-emerald-700/50";
      case "POST":
        return "text-amber-400 bg-amber-950/40 border-amber-700/50";
      case "PUT":
        return "text-sky-400 bg-sky-950/40 border-sky-700/50";
      case "DELETE":
        return "text-rose-400 bg-rose-950/40 border-rose-700/50";
      case "PATCH":
        return "text-purple-400 bg-purple-950/40 border-purple-700/50";
      default:
        return "text-zinc-300 bg-zinc-800 border-zinc-700";
    }
  };

  // Query Params Handlers
  const handleAddParam = () => {
    setRequest((prev) => ({
      ...prev,
      query_params: [...prev.query_params, { key: "", value: "", enabled: true }],
    }));
  };

  const handleUpdateParam = (index: number, field: keyof KeyValue, val: any) => {
    setRequest((prev) => {
      const updated = [...prev.query_params];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, query_params: updated };
    });
  };

  const handleDeleteParam = (index: number) => {
    setRequest((prev) => ({
      ...prev,
      query_params: prev.query_params.filter((_, i) => i !== index),
    }));
  };

  // Headers Handlers
  const handleAddHeader = () => {
    setRequest((prev) => ({
      ...prev,
      headers: [...prev.headers, { key: "", value: "", enabled: true }],
    }));
  };

  const handleUpdateHeader = (index: number, field: keyof KeyValue, val: any) => {
    setRequest((prev) => {
      const updated = [...prev.headers];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, headers: updated };
    });
  };

  const handleDeleteHeader = (index: number) => {
    setRequest((prev) => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index),
    }));
  };

  // Prettify JSON body
  const handlePrettifyJson = () => {
    if (!request.body) return;
    try {
      const parsed = JSON.parse(request.body);
      setRequest((prev) => ({ ...prev, body: JSON.stringify(parsed, null, 2) }));
    } catch {
      // not valid json yet, ignore
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#14161d] text-zinc-200" onKeyDown={handleKeyDown}>
      {/* Top Omnibar: Method, URL, Send Button */}
      <div className="p-3 border-b border-[#232730] flex items-center space-x-2">
        {/* Method Select */}
        <div className="relative">
          <select
            value={request.method}
            onChange={(e) => updateMethod(e.target.value)}
            className={`appearance-none font-mono font-bold text-xs px-3 py-1.5 rounded border cursor-pointer focus:outline-none ${getMethodColor(
              request.method
            )}`}
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m} className="bg-[#181b22] text-zinc-200">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* URL Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="https://api.example.com/v1/users or {{baseUrl}}/users"
            value={request.url}
            onChange={(e) => updateUrl(e.target.value)}
            className="w-full bg-[#0d0f14] border border-[#272c38] focus:border-blue-500 rounded px-3 py-1.5 font-mono text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={executeActiveRequest}
          disabled={isLoading || !request.url.trim()}
          className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/40 disabled:text-zinc-500 text-white font-medium text-xs rounded transition-colors cursor-pointer shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
              <kbd className="hidden sm:inline-block text-[9px] font-mono opacity-60 ml-1">
                ↵
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Request Sub-Tabs */}
      <div className="flex items-center border-b border-[#232730] px-3 bg-[#111318]">
        <button
          onClick={() => setRequestTab("params")}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            requestTab === "params"
              ? "text-blue-400 border-blue-500"
              : "text-zinc-400 border-transparent hover:text-zinc-200"
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>Params</span>
          {request.query_params.filter((p) => p.enabled && p.key).length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          )}
        </button>

        <button
          onClick={() => setRequestTab("headers")}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            requestTab === "headers"
              ? "text-blue-400 border-blue-500"
              : "text-zinc-400 border-transparent hover:text-zinc-200"
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>Headers</span>
          {request.headers.filter((h) => h.enabled && h.key).length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          )}
        </button>

        <button
          onClick={() => setRequestTab("auth")}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            requestTab === "auth"
              ? "text-blue-400 border-blue-500"
              : "text-zinc-400 border-transparent hover:text-zinc-200"
          }`}
        >
          <Lock className="w-3 h-3" />
          <span>Auth</span>
          {request.auth.type !== "None" && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          )}
        </button>

        <button
          onClick={() => setRequestTab("body")}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            requestTab === "body"
              ? "text-blue-400 border-blue-500"
              : "text-zinc-400 border-transparent hover:text-zinc-200"
          }`}
        >
          <Code2 className="w-3 h-3" />
          <span>Body</span>
          {request.body_type !== "none" && request.body && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          )}
        </button>
      </div>

      {/* Request Sub-Tab Body */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {/* PARAMS TAB */}
        {requestTab === "params" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
              <span>Query Parameters</span>
              <button
                onClick={handleAddParam}
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Param</span>
              </button>
            </div>

            <div className="border border-[#232730] rounded overflow-hidden">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#181b22] text-zinc-400 text-[10px] uppercase">
                  <tr>
                    <th className="w-8 p-1.5 text-center"></th>
                    <th className="p-1.5 border-r border-[#232730]">Key</th>
                    <th className="p-1.5">Value</th>
                    <th className="w-8 p-1.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232730]">
                  {request.query_params.map((param, idx) => (
                    <tr key={idx} className="hover:bg-[#181b22]/50">
                      <td className="p-1 text-center">
                        <input
                          type="checkbox"
                          checked={param.enabled}
                          onChange={(e) => handleUpdateParam(idx, "enabled", e.target.checked)}
                          className="rounded border-[#272c38] text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-1 border-r border-[#232730]">
                        <input
                          type="text"
                          placeholder="Key"
                          value={param.key}
                          onChange={(e) => handleUpdateParam(idx, "key", e.target.value)}
                          className="w-full bg-transparent px-1.5 py-0.5 text-zinc-200 focus:outline-none"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          placeholder="Value"
                          value={param.value}
                          onChange={(e) => handleUpdateParam(idx, "value", e.target.value)}
                          className="w-full bg-transparent px-1.5 py-0.5 text-zinc-200 focus:outline-none"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button
                          onClick={() => handleDeleteParam(idx)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {request.query_params.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-zinc-500 text-xs italic">
                        No parameters added yet. Click &quot;Add Param&quot; to configure query strings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HEADERS TAB */}
        {requestTab === "headers" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
              <span>HTTP Headers</span>
              <button
                onClick={handleAddHeader}
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Header</span>
              </button>
            </div>

            <div className="border border-[#232730] rounded overflow-hidden">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#181b22] text-zinc-400 text-[10px] uppercase">
                  <tr>
                    <th className="w-8 p-1.5 text-center"></th>
                    <th className="p-1.5 border-r border-[#232730]">Header Key</th>
                    <th className="p-1.5">Value</th>
                    <th className="w-8 p-1.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232730]">
                  {request.headers.map((h, idx) => (
                    <tr key={idx} className="hover:bg-[#181b22]/50">
                      <td className="p-1 text-center">
                        <input
                          type="checkbox"
                          checked={h.enabled}
                          onChange={(e) => handleUpdateHeader(idx, "enabled", e.target.checked)}
                          className="rounded border-[#272c38] text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-1 border-r border-[#232730]">
                        <input
                          type="text"
                          placeholder="Content-Type"
                          value={h.key}
                          onChange={(e) => handleUpdateHeader(idx, "key", e.target.value)}
                          className="w-full bg-transparent px-1.5 py-0.5 text-zinc-200 focus:outline-none"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          placeholder="application/json"
                          value={h.value}
                          onChange={(e) => handleUpdateHeader(idx, "value", e.target.value)}
                          className="w-full bg-transparent px-1.5 py-0.5 text-zinc-200 focus:outline-none"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button
                          onClick={() => handleDeleteHeader(idx)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {request.headers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-zinc-500 text-xs italic">
                        No custom headers configured. Click &quot;Add Header&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUTH TAB */}
        {requestTab === "auth" && (
          <div className="max-w-md space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-zinc-400 text-xs">Auth Type:</span>
              <select
                value={request.auth.type}
                onChange={(e) => {
                  const t = e.target.value as any;
                  setRequest((prev) => ({
                    ...prev,
                    auth: {
                      type: t,
                      data:
                        t === "Bearer"
                          ? { token: "" }
                          : t === "Basic"
                          ? { username: "", password: "" }
                          : t === "ApiKey"
                          ? { key: "X-API-Key", value: "", add_to: "header" }
                          : undefined,
                    },
                  }));
                }}
                className="bg-[#181b22] border border-[#272c38] rounded px-2.5 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
              >
                <option value="None">No Auth</option>
                <option value="Bearer">Bearer Token</option>
                <option value="Basic">Basic Auth</option>
                <option value="ApiKey">API Key</option>
              </select>
            </div>

            {request.auth.type === "Bearer" && (
              <div className="space-y-1.5 bg-[#181b22] p-3 rounded border border-[#272c38]">
                <label className="text-zinc-400 text-[11px] font-mono">Token</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={request.auth.data?.token || ""}
                  onChange={(e) =>
                    setRequest((prev) => ({
                      ...prev,
                      auth: {
                        type: "Bearer",
                        data: { token: e.target.value },
                      },
                    }))
                  }
                  className="w-full bg-[#101217] border border-[#272c38] rounded px-2.5 py-1 font-mono text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {request.auth.type === "Basic" && (
              <div className="space-y-2 bg-[#181b22] p-3 rounded border border-[#272c38]">
                <div>
                  <label className="text-zinc-400 text-[11px] font-mono">Username</label>
                  <input
                    type="text"
                    value={request.auth.data?.username || ""}
                    onChange={(e) =>
                      setRequest((prev) => ({
                        ...prev,
                        auth: {
                          type: "Basic",
                          data: {
                            username: e.target.value,
                            password: prev.auth.data?.password || "",
                          },
                        },
                      }))
                    }
                    className="w-full bg-[#101217] border border-[#272c38] rounded px-2.5 py-1 font-mono text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-[11px] font-mono">Password</label>
                  <input
                    type="password"
                    value={request.auth.data?.password || ""}
                    onChange={(e) =>
                      setRequest((prev) => ({
                        ...prev,
                        auth: {
                          type: "Basic",
                          data: {
                            username: prev.auth.data?.username || "",
                            password: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full bg-[#101217] border border-[#272c38] rounded px-2.5 py-1 font-mono text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {request.auth.type === "ApiKey" && (
              <div className="space-y-2 bg-[#181b22] p-3 rounded border border-[#272c38]">
                <div>
                  <label className="text-zinc-400 text-[11px] font-mono">Key</label>
                  <input
                    type="text"
                    value={request.auth.data?.key || ""}
                    onChange={(e) =>
                      setRequest((prev) => ({
                        ...prev,
                        auth: {
                          type: "ApiKey",
                          data: {
                            ...prev.auth.data,
                            key: e.target.value,
                            value: prev.auth.data?.value || "",
                            add_to: prev.auth.data?.add_to || "header",
                          },
                        },
                      }))
                    }
                    className="w-full bg-[#101217] border border-[#272c38] rounded px-2.5 py-1 font-mono text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-[11px] font-mono">Value</label>
                  <input
                    type="password"
                    value={request.auth.data?.value || ""}
                    onChange={(e) =>
                      setRequest((prev) => ({
                        ...prev,
                        auth: {
                          type: "ApiKey",
                          data: {
                            ...prev.auth.data,
                            key: prev.auth.data?.key || "",
                            value: e.target.value,
                            add_to: prev.auth.data?.add_to || "header",
                          },
                        },
                      }))
                    }
                    className="w-full bg-[#101217] border border-[#272c38] rounded px-2.5 py-1 font-mono text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* BODY TAB */}
        {requestTab === "body" && (
          <div className="h-full flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs font-mono">
                {(["none", "json", "raw", "x-www-form-urlencoded"] as const).map((type) => (
                  <label key={type} className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="body_type"
                      value={type}
                      checked={request.body_type === type}
                      onChange={() => setRequest((prev) => ({ ...prev, body_type: type }))}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span className={request.body_type === type ? "text-blue-400 font-medium" : "text-zinc-400"}>
                      {type}
                    </span>
                  </label>
                ))}
              </div>

              {request.body_type === "json" && (
                <button
                  onClick={handlePrettifyJson}
                  className="px-2 py-0.5 rounded bg-[#1c202a] hover:bg-[#252a38] text-zinc-300 text-[10px] font-mono border border-[#2b303c] cursor-pointer"
                >
                  Prettify JSON
                </button>
              )}
            </div>

            {request.body_type !== "none" ? (
              <textarea
                value={request.body || ""}
                onChange={(e) => setRequest((prev) => ({ ...prev, body: e.target.value }))}
                placeholder={
                  request.body_type === "json"
                    ? '{\n  "key": "value"\n}'
                    : "Enter raw request payload..."
                }
                className="flex-1 w-full h-64 bg-[#0d0f14] border border-[#272c38] focus:border-blue-500 rounded p-3 font-mono text-xs text-zinc-200 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center border border-dashed border-[#232730] rounded p-6 text-zinc-500 text-xs">
                This request does not have a body. Select &quot;json&quot; or &quot;raw&quot; above to configure one.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
