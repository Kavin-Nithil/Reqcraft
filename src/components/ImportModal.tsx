import React from "react";
import { useStore } from "../store/useStore";
import {
  X,
  Terminal,
  FolderDown,
  FileJson,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ArrowRight,
} from "lucide-react";

export const ImportModal: React.FC = () => {
  const { isImportModalOpen, setImportModalOpen, importCurl, importPostman } = useStore();
  const [tab, setTab] = React.useState<"upload" | "curl" | "paste">("upload");
  const [curlText, setCurlText] = React.useState("");
  const [rawJsonText, setRawJsonText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  // Selected file preview state
  const [selectedFile, setSelectedFile] = React.useState<{
    name: string;
    size: string;
    content: string;
    colName?: string;
    requestCount?: number;
    error?: string;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isImportModalOpen) return null;

  const processJsonContent = (content: string, filename: string, sizeBytes: number) => {
    const sizeStr =
      sizeBytes < 1024
        ? `${sizeBytes} B`
        : `${(sizeBytes / 1024).toFixed(1)} KB`;

    try {
      const parsed = JSON.parse(content);
      let count = 0;
      const countReqs = (items: any[]) => {
        if (!Array.isArray(items)) return;
        for (const it of items) {
          if (it.request) count++;
          if (Array.isArray(it.item)) countReqs(it.item);
        }
      };
      if (Array.isArray(parsed.item)) countReqs(parsed.item);

      setSelectedFile({
        name: filename,
        size: sizeStr,
        content,
        colName: parsed.info?.name || "Postman Collection",
        requestCount: count,
      });
    } catch (e: any) {
      setSelectedFile({
        name: filename,
        size: sizeStr,
        content,
        error: "Invalid JSON format: please select a valid Postman Collection v2.1 file.",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          processJsonContent(text, file.name, file.size);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          processJsonContent(text, file.name, file.size);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportUploadedFile = async () => {
    if (!selectedFile?.content) return;
    setIsLoading(true);
    try {
      await importPostman(selectedFile.content);
      setImportModalOpen(false);
      setSelectedFile(null);
    } catch (e: any) {
      alert(`Import error: ${e?.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportCurl = async () => {
    if (!curlText.trim()) return;
    setIsLoading(true);
    try {
      await importCurl(curlText.trim());
      setImportModalOpen(false);
      setCurlText("");
    } catch (e: any) {
      alert(`cURL import error: ${e?.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportRawJson = async () => {
    if (!rawJsonText.trim()) return;
    setIsLoading(true);
    try {
      await importPostman(rawJsonText.trim());
      setImportModalOpen(false);
      setRawJsonText("");
    } catch (e: any) {
      alert(`JSON import error: ${e?.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={() => setImportModalOpen(false)}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#12141c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm">Import Postman & APIs</h3>
              <p className="text-[11px] text-zinc-500">Upload collection JSON files or import cURL</p>
            </div>
          </div>
          <button
            onClick={() => setImportModalOpen(false)}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dia-style Segmented Navigation Tabs */}
        <div className="px-5 pt-3 pb-1 border-b border-white/[0.06] bg-black/20">
          <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]">
            <button
              onClick={() => setTab("upload")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                tab === "upload"
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Upload JSON File</span>
            </button>
            <button
              onClick={() => setTab("curl")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                tab === "curl"
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>cURL Command</span>
            </button>
            <button
              onClick={() => setTab("paste")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                tab === "paste"
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Paste Raw JSON</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {/* TAB 1: UPLOAD POSTMAN COLLECTION FILE */}
          {tab === "upload" && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                /* Drag & Drop Zone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10 scale-[1.01]"
                      : "border-white/[0.1] hover:border-white/[0.2] bg-white/[0.01] hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
                    <UploadCloud className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="font-semibold text-zinc-100 text-sm mb-1">
                    Drag and drop your Postman collection file
                  </h4>
                  <p className="text-xs text-zinc-400 mb-3">
                    Select a <span className="text-blue-400 font-mono">*.postman_collection.json</span> file
                  </p>
                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 text-xs font-medium transition-colors"
                  >
                    Browse Files
                  </button>
                </div>
              ) : (
                /* Selected File Preview Card */
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                        <FileJson className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-zinc-100 text-xs truncate max-w-xs">
                            {selectedFile.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ({selectedFile.size})
                          </span>
                        </div>

                        {selectedFile.error ? (
                          <div className="flex items-center space-x-1.5 text-rose-400 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{selectedFile.error}</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5 text-[11px] text-zinc-400">
                            <p>
                              Collection:{" "}
                              <span className="text-blue-400 font-medium">
                                {selectedFile.colName}
                              </span>
                            </p>
                            <p>
                              Requests found:{" "}
                              <span className="text-emerald-400 font-mono font-bold">
                                {selectedFile.requestCount}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-zinc-500 hover:text-zinc-200 rounded"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Change File
                    </button>
                    <button
                      onClick={handleImportUploadedFile}
                      disabled={isLoading || Boolean(selectedFile.error)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isLoading ? "Importing..." : "Confirm & Import Collection"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CURL COMMAND */}
          {tab === "curl" && (
            <div className="space-y-3">
              <label className="text-zinc-400 text-xs">
                Paste raw cURL command from terminal, Chrome DevTools, or API documentation:
              </label>
              <textarea
                rows={6}
                placeholder="curl -X POST https://api.example.com/v1/auth/login -H 'Content-Type: application/json' -d '{&quot;email&quot;: &quot;kavin@example.com&quot;}'"
                value={curlText}
                onChange={(e) => setCurlText(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] focus:border-blue-500 rounded-xl p-3 font-mono text-xs text-zinc-200 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportCurl}
                  disabled={isLoading || !curlText.trim()}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Importing..." : "Import Request"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PASTE RAW JSON */}
          {tab === "paste" && (
            <div className="space-y-3">
              <label className="text-zinc-400 text-xs">
                Paste raw Postman Collection v2.1 JSON string:
              </label>
              <textarea
                rows={6}
                placeholder='{\n  "info": {\n    "name": "My API Collection",\n    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"\n  },\n  "item": [...]\n}'
                value={rawJsonText}
                onChange={(e) => setRawJsonText(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] focus:border-blue-500 rounded-xl p-3 font-mono text-xs text-zinc-200 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportRawJson}
                  disabled={isLoading || !rawJsonText.trim()}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Importing..." : "Import JSON"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
