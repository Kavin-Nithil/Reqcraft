import React from "react";
import { useStore } from "../store/useStore";
import {
  Copy,
  Check,
  Zap,
  HardDrive,
  AlertCircle,
  FileCode,
  FileText,
  Search,
  Download,
  Eye,
} from "lucide-react";
import { downloadJsonFile } from "../services/tauri";

export const ResponsePanel: React.FC = () => {
  const { getActiveTab, responseTab, setResponseTab } = useStore();
  const activeTab = getActiveTab();
  const response = activeTab.response;
  const isLoading = activeTab.isLoading;
  const error = activeTab.error;

  const [copied, setCopied] = React.useState(false);
  const [filterQuery, setFilterQuery] = React.useState("");

  const handleCopy = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadResponse = () => {
    if (!response) return;
    const ext = response.is_json ? "json" : "txt";
    downloadJsonFile(`response_${Date.now()}.${ext}`, response.body);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40 shadow-xs shadow-emerald-500/20";
    }
    if (status >= 300 && status < 400) {
      return "text-sky-400 bg-sky-950/60 border-sky-500/40 shadow-xs shadow-sky-500/20";
    }
    if (status >= 400 && status < 500) {
      return "text-amber-400 bg-amber-950/60 border-amber-500/40 shadow-xs shadow-amber-500/20";
    }
    return "text-rose-400 bg-rose-950/60 border-rose-500/40 shadow-xs shadow-rose-500/20";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Prettify body if JSON
  const formattedBody = React.useMemo(() => {
    if (!response?.body) return "";
    if (response.is_json) {
      try {
        const obj = JSON.parse(response.body);
        return JSON.stringify(obj, null, 2);
      } catch {
        return response.body;
      }
    }
    return response.body;
  }, [response]);

  return (
    <div className="flex flex-col h-full bg-[#0d0e14]/90 backdrop-blur-md border-l border-white/[0.06] text-zinc-200">
      {/* Response Header / Metrics Bar */}
      <div className="h-12 px-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01] text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wider">
            Response
          </span>

          {response && (
            <div className="flex items-center space-x-2">
              {/* Status Code Badge */}
              <div
                className={`px-2.5 py-0.5 rounded-lg font-mono font-bold text-[11px] border ${getStatusColor(
                  response.status
                )}`}
              >
                {response.status} {response.status_text}
              </div>

              {/* Time Metric */}
              <div className="flex items-center space-x-1.5 text-zinc-300 font-mono text-[11px] px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{response.metrics.total_ms} ms</span>
              </div>

              {/* Size Metric */}
              <div className="flex items-center space-x-1.5 text-zinc-300 font-mono text-[11px] px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <HardDrive className="w-3 h-3 text-blue-400" />
                <span>{formatSize(response.size_bytes)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        {response && (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleDownloadResponse}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 hover:text-white transition-colors cursor-pointer text-[11px]"
              title="Save Response to File"
            >
              <Download className="w-3 h-3 text-zinc-400" />
              <span>Save</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 hover:text-white transition-colors cursor-pointer text-[11px]"
              title="Copy Response Body"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Response Sub-Tabs */}
      {response && (
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 bg-white/[0.01]">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setResponseTab("body")}
              className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                responseTab === "body"
                  ? "text-blue-400 border-blue-500 bg-white/[0.02]"
                  : "text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Pretty</span>
              {response.is_json && (
                <span className="text-[10px] text-zinc-500 font-mono">JSON</span>
              )}
            </button>

            <button
              onClick={() => setResponseTab("raw")}
              className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                responseTab === "raw"
                  ? "text-blue-400 border-blue-500 bg-white/[0.02]"
                  : "text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              <span>Raw</span>
            </button>

            <button
              onClick={() => setResponseTab("headers")}
              className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                responseTab === "headers"
                  ? "text-blue-400 border-blue-500 bg-white/[0.02]"
                  : "text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Headers</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                ({response.headers.length})
              </span>
            </button>

            <button
              onClick={() => setResponseTab("preview")}
              className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                responseTab === "preview"
                  ? "text-blue-400 border-blue-500 bg-white/[0.02]"
                  : "text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {responseTab === "body" && (
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter response body..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg pl-7 pr-2.5 py-0.5 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          )}
        </div>
      )}

      {/* Main Response Content */}
      <div className="flex-1 overflow-y-auto p-3 text-xs font-mono">
        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>Request Execution Error</span>
            </div>
            <p className="text-xs text-rose-200/80 leading-relaxed font-mono whitespace-pre-wrap">
              {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center space-y-3 text-zinc-500">
            <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Dispatching request via Rust engine...</p>
          </div>
        )}

        {/* Empty State */}
        {!response && !isLoading && !error && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-zinc-400 shadow-inner">
              <Zap className="w-6 h-6 text-blue-400/80" />
            </div>
            <p className="text-xs text-zinc-300 font-medium">No response yet</p>
            <p className="text-[11px] text-zinc-500">
              Hit &quot;Send&quot; or press <kbd className="px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] font-mono text-zinc-300">Ctrl+Enter</kbd> to execute
            </p>
          </div>
        )}

        {/* Pretty JSON Response Body */}
        {response && !isLoading && responseTab === "body" && (
          <pre className="text-zinc-200 leading-relaxed overflow-x-auto whitespace-pre font-mono text-[11px] selection:bg-blue-900/50">
            {filterQuery
              ? formattedBody
                  .split("\n")
                  .filter((line) => line.toLowerCase().includes(filterQuery.toLowerCase()))
                  .join("\n")
              : formattedBody}
          </pre>
        )}

        {/* Raw Response */}
        {response && !isLoading && responseTab === "raw" && (
          <pre className="text-zinc-300 text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
            {response.body}
          </pre>
        )}

        {/* Preview Tab (Rendered HTML or Formatted view) */}
        {response && !isLoading && responseTab === "preview" && (
          <div className="h-full w-full bg-white rounded-lg overflow-hidden">
            <iframe
              title="HTML Preview"
              srcDoc={response.body}
              sandbox="allow-same-origin"
              className="w-full h-full border-0"
            />
          </div>
        )}

        {/* Response Headers Tab */}
        {response && !isLoading && responseTab === "headers" && (
          <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-black/20">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-white/[0.03] text-zinc-400 text-[10px] uppercase">
                <tr>
                  <th className="p-2 border-r border-white/[0.06]">Header Key</th>
                  <th className="p-2">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {response.headers.map((h, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-2 border-r border-white/[0.06] text-blue-400 font-medium">
                      {h.key}
                    </td>
                    <td className="p-2 text-zinc-300 break-all">{h.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
