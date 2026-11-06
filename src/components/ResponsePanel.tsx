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
} from "lucide-react";

export const ResponsePanel: React.FC = () => {
  const { response, isLoading, error, responseTab, setResponseTab } = useStore();
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

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return "text-emerald-400 bg-emerald-950/40 border-emerald-700/50";
    }
    if (status >= 300 && status < 400) {
      return "text-sky-400 bg-sky-950/40 border-sky-700/50";
    }
    if (status >= 400 && status < 500) {
      return "text-amber-400 bg-amber-950/40 border-amber-700/50";
    }
    return "text-rose-400 bg-rose-950/40 border-rose-700/50";
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
    <div className="flex flex-col h-full bg-[#111318] border-l border-[#232730] text-zinc-200">
      {/* Response Header / Metrics Bar */}
      <div className="h-10 px-3 border-b border-[#232730] flex items-center justify-between bg-[#14161c] text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wider">
            Response
          </span>

          {response && (
            <div className="flex items-center space-x-2">
              {/* Status Code Badge */}
              <div
                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${getStatusColor(
                  response.status
                )}`}
              >
                {response.status} {response.status_text}
              </div>

              {/* Time Metric */}
              <div className="flex items-center space-x-1 text-zinc-400 font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#1c202a] border border-[#2b303c]">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{response.metrics.total_ms} ms</span>
              </div>

              {/* Size Metric */}
              <div className="flex items-center space-x-1 text-zinc-400 font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#1c202a] border border-[#2b303c]">
                <HardDrive className="w-3 h-3 text-blue-400" />
                <span>{formatSize(response.size_bytes)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        {response && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2 py-1 rounded bg-[#181b22] hover:bg-[#20242e] border border-[#272c38] text-zinc-300 hover:text-white transition-colors cursor-pointer text-[11px]"
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
        <div className="flex items-center justify-between border-b border-[#232730] px-3 bg-[#111318]">
          <div className="flex items-center">
            <button
              onClick={() => setResponseTab("body")}
              className={`flex items-center space-x-1.5 py-1.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                responseTab === "body"
                  ? "text-blue-400 border-blue-500"
                  : "text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              <FileCode className="w-3 h-3" />
              <span>Body</span>
              {response.is_json && (
                <span className="text-[10px] text-zinc-500 font-mono">JSON</span>
              )}
            </button>

            <button
              onClick={() => setResponseTab("headers")}
              className={`flex items-center space-x-1.5 py-1.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                responseTab === "headers"
                  ? "text-blue-400 border-blue-500"
                  : "text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Headers</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                ({response.headers.length})
              </span>
            </button>

            <button
              onClick={() => setResponseTab("raw")}
              className={`flex items-center space-x-1.5 py-1.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                responseTab === "raw"
                  ? "text-blue-400 border-blue-500"
                  : "text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              <span>Raw</span>
            </button>
          </div>

          {responseTab === "body" && (
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter response..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="bg-[#181b22] border border-[#272c38] rounded pl-6 pr-2 py-0.5 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          )}
        </div>
      )}

      {/* Main Response Area */}
      <div className="flex-1 overflow-y-auto p-3 text-xs font-mono">
        {/* Error State */}
        {error && (
          <div className="p-4 rounded bg-rose-950/20 border border-rose-800/40 text-rose-300 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>Request Failed</span>
            </div>
            <p className="text-xs text-rose-200/80 leading-relaxed font-mono whitespace-pre-wrap">
              {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center space-y-3 text-zinc-500">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Dispatching request via Rust engine...</p>
          </div>
        )}

        {/* Empty State */}
        {!response && !isLoading && !error && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#181b22] border border-[#272c38] flex items-center justify-center text-zinc-400">
              <Zap className="w-6 h-6" />
            </div>
            <p className="text-xs text-zinc-400">No response to display</p>
            <p className="text-[11px] text-zinc-600">
              Click &quot;Send&quot; or press <kbd className="px-1.5 py-0.5 rounded bg-[#181b22] border border-[#2b303c] font-mono text-zinc-400">Ctrl+Enter</kbd> to execute
            </p>
          </div>
        )}

        {/* Response Body Tab */}
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

        {/* Response Headers Tab */}
        {response && !isLoading && responseTab === "headers" && (
          <div className="border border-[#232730] rounded overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#181b22] text-zinc-400 text-[10px] uppercase">
                <tr>
                  <th className="p-1.5 border-r border-[#232730]">Header Key</th>
                  <th className="p-1.5">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232730]">
                {response.headers.map((h, i) => (
                  <tr key={i} className="hover:bg-[#181b22]/50">
                    <td className="p-1.5 border-r border-[#232730] text-blue-400 font-medium">
                      {h.key}
                    </td>
                    <td className="p-1.5 text-zinc-300 break-all">{h.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Response Raw Tab */}
        {response && !isLoading && responseTab === "raw" && (
          <pre className="text-zinc-300 text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
            {response.body}
          </pre>
        )}
      </div>
    </div>
  );
};
