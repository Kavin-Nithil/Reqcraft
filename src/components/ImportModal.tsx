import React from "react";
import { useStore } from "../store/useStore";
import { X, Terminal, FolderDown, FileJson } from "lucide-react";

export const ImportModal: React.FC = () => {
  const { isImportModalOpen, setImportModalOpen, importCurl, importPostman } = useStore();
  const [tab, setTab] = React.useState<"curl" | "postman">("curl");
  const [curlText, setCurlText] = React.useState("");
  const [postmanText, setPostmanText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  if (!isImportModalOpen) return null;

  const handleImportCurl = async () => {
    if (!curlText.trim()) return;
    setIsLoading(true);
    try {
      await importCurl(curlText.trim());
      setImportModalOpen(false);
      setCurlText("");
    } catch (e: any) {
      alert(`Import error: ${e?.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportPostman = async () => {
    if (!postmanText.trim()) return;
    setIsLoading(true);
    try {
      await importPostman(postmanText.trim());
      setImportModalOpen(false);
      setPostmanText("");
    } catch (e: any) {
      alert(`Import error: ${e?.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) setPostmanText(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      onClick={() => setImportModalOpen(false)}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#14171d] border border-[#272c38] rounded-lg shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#232730]">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-zinc-100 text-sm">Import Data</span>
          </div>
          <button
            onClick={() => setImportModalOpen(false)}
            className="text-zinc-500 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#232730] bg-[#101217]">
          <button
            onClick={() => setTab("curl")}
            className={`flex-1 py-2 text-center text-xs font-medium border-b-2 flex items-center justify-center space-x-1.5 ${
              tab === "curl"
                ? "text-blue-400 border-blue-500 bg-[#161820]"
                : "text-zinc-400 border-transparent hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>cURL Command</span>
          </button>
          <button
            onClick={() => setTab("postman")}
            className={`flex-1 py-2 text-center text-xs font-medium border-b-2 flex items-center justify-center space-x-1.5 ${
              tab === "postman"
                ? "text-blue-400 border-blue-500 bg-[#161820]"
                : "text-zinc-400 border-transparent hover:text-zinc-200"
            }`}
          >
            <FolderDown className="w-3.5 h-3.5" />
            <span>Postman v2.1 Collection</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {tab === "curl" && (
            <div className="space-y-3">
              <label className="text-zinc-400 text-xs">
                Paste raw cURL command from terminal, browser DevTools, or documentation:
              </label>
              <textarea
                rows={7}
                placeholder="curl -X POST https://api.example.com/v1/login -H 'Content-Type: application/json' -d '{\&quot;username\&quot;: \&quot;admin\&quot;}'"
                value={curlText}
                onChange={(e) => setCurlText(e.target.value)}
                className="w-full bg-[#0d0f14] border border-[#272c38] focus:border-blue-500 rounded p-3 font-mono text-xs text-zinc-200 focus:outline-none resize-none"
              />
              <div className="flex justify-end space-x-2">
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
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/40 text-white font-medium rounded transition-colors"
                >
                  Import Request
                </button>
              </div>
            </div>
          )}

          {tab === "postman" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-zinc-400 text-xs">
                  Paste Postman Collection JSON or upload a `.json` file:
                </label>
                <label className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows={7}
                placeholder='{\n  "info": {\n    "name": "My Postman Collection"\n  },\n  "item": [...]\n}'
                value={postmanText}
                onChange={(e) => setPostmanText(e.target.value)}
                className="w-full bg-[#0d0f14] border border-[#272c38] focus:border-blue-500 rounded p-3 font-mono text-xs text-zinc-200 focus:outline-none resize-none"
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportPostman}
                  disabled={isLoading || !postmanText.trim()}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/40 text-white font-medium rounded transition-colors"
                >
                  Import Collection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
