import React from "react";
import { useStore } from "../store/useStore";
import { Search, ArrowRight } from "lucide-react";

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    collections,
    history,
    loadSavedRequest,
    setRequest,
  } = useStore();

  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery("");
    }
  }, [isCommandPaletteOpen]);

  // Handle global shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "p")) {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === "Escape" && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Flatten searchable items
  const items: Array<{
    type: "request" | "history";
    id: string;
    title: string;
    subtitle: string;
    method: string;
    action: () => void;
  }> = [];

  collections.forEach((col) => {
    col.requests.forEach((r) => {
      if (
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.request.url.toLowerCase().includes(query.toLowerCase())
      ) {
        items.push({
          type: "request",
          id: r.id,
          title: r.name,
          subtitle: `${col.name} • ${r.request.url}`,
          method: r.request.method,
          action: () => {
            loadSavedRequest(r);
            setCommandPaletteOpen(false);
          },
        });
      }
    });
  });

  history.forEach((h) => {
    if (h.request.url.toLowerCase().includes(query.toLowerCase())) {
      items.push({
        type: "history",
        id: h.id,
        title: h.request.url,
        subtitle: `History • ${h.executed_at.substring(11, 19)}`,
        method: h.request.method,
        action: () => {
          setRequest(() => ({ ...h.request }));
          if (h.response) {
            useStore.setState({ response: h.response });
          }
          setCommandPaletteOpen(false);
        },
      });
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(1, items.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    }
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
        return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  return (
    <div
      onClick={() => setCommandPaletteOpen(false)}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#14171d] border border-[#272c38] rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-[#232730]">
          <Search className="w-4 h-4 text-zinc-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search requests, collections, history... (Type to filter)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c202a] text-zinc-500 border border-[#2b303c]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {items.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={item.id + idx}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-600/20 text-white border border-blue-500/30" : "hover:bg-[#181b22] text-zinc-300"
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getMethodBadgeClass(
                      item.method
                    )}`}
                  >
                    {item.method}
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-medium truncate">{item.title}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{item.subtitle}</div>
                  </div>
                </div>

                {isSelected && <ArrowRight className="w-3.5 h-3.5 text-blue-400" />}
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No matching requests or history entries found.
            </div>
          )}
        </div>

        {/* Footer Shortcut hint */}
        <div className="px-4 py-2 bg-[#101217] border-t border-[#232730] text-[10px] text-zinc-500 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Reqcraft Quick Switcher</span>
        </div>
      </div>
    </div>
  );
};
