import React, { useState } from "react";
import {
  Activity,
  X,
  Search,
  Trash2,
  Check,
  Copy,
  Clock,
  ArrowDownLeft,
  Filter,
} from "lucide-react";
import {
  useNetworkRequests,
  clearNetworkRequests,
  type NetworkRequestRecord,
} from "@/utils/networkTracker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkRequestsInspector: React.FC<Props> = ({ isOpen, onClose }) => {
  const requests = useNetworkRequests();
  const [filterType, setFilterType] = useState<"all" | "timedtext" | "native">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filtered = requests.filter((req) => {
    if (filterType === "timedtext" && !req.url.includes("timedtext")) return false;
    if (filterType === "native" && req.type !== "native_bridge" && req.type !== "timedtext_interception")
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        req.url.toLowerCase().includes(q) ||
        req.method.toLowerCase().includes(q) ||
        req.responseBodyPreview?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedRequest =
    filtered.find((r) => r.id === selectedId) || (filtered.length > 0 ? filtered[0] : null);

  const handleCopy = (text: string) => {
    try {
      void navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <div
      id="network-inspector-modal"
      data-testid="network-inspector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[85vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-neutral-950/80 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">Live Network Traffic Inspector</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {requests.length} captured
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                  {filtered.length} shown
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Captures timedtext, native bridge requests, and shows the first 50 characters of response bodies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="clear-network-logs-button"
              type="button"
              onClick={clearNetworkRequests}
              disabled={requests.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 disabled:opacity-50 transition"
              title="Clear all recorded logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              id="close-network-inspector-button"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Close inspector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-neutral-900/90 border-b border-neutral-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-neutral-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>
            {(
              [
                { key: "all", label: "All Requests" },
                { key: "timedtext", label: "TimedText" },
                { key: "native", label: "Native Bridge" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterType(tab.key)}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  filterType === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search URL, method, preview…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Body content: Split list & detail */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-800 overflow-hidden">
          {/* Requests List */}
          <div className="overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                No network requests recorded yet.
              </div>
            ) : (
              filtered.map((req) => {
                const isSelected = req.id === selectedRequest?.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedId(req.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition text-xs space-y-1.5 ${
                      isSelected
                        ? "bg-blue-950/40 border-blue-700/60"
                        : "bg-neutral-950/40 border-neutral-800/60 hover:bg-neutral-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                            req.isPending
                              ? "bg-yellow-900/60 text-yellow-300"
                              : req.status === 200
                                ? "bg-emerald-900/60 text-emerald-300"
                                : "bg-red-900/60 text-red-300"
                          }`}
                        >
                          {req.isPending ? "PENDING" : req.status}
                        </span>
                        <span className="font-semibold text-neutral-300 font-mono text-[11px]">
                          {req.method}
                        </span>
                        <span className="text-[10px] text-neutral-500">{req.type}</span>
                      </div>
                      {req.duration !== undefined && (
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {req.duration}ms
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-[11px] text-neutral-300 truncate" title={req.url}>
                      {req.url}
                    </div>

                    {/* Prominent first 200 chars preview */}
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono bg-neutral-900/80 px-2 py-1 rounded border border-neutral-800/80">
                      <ArrowDownLeft className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="text-neutral-500">First 200 chars:</span>
                      <span className="text-emerald-400 font-semibold truncate">
                        {req.responseBodyPreview ? `"${req.responseBodyPreview}"` : req.isPending ? "loading…" : "[empty]"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Request Detail Panel */}
          <div className="overflow-y-auto p-4 space-y-4 text-xs">
            {selectedRequest ? (
              <>
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold ${
                        selectedRequest.status === 200
                          ? "bg-emerald-900/60 text-emerald-300"
                          : "bg-red-900/60 text-red-300"
                      }`}
                    >
                      {selectedRequest.status || "PENDING"}
                    </span>
                    <span className="font-bold text-neutral-200 text-sm">
                      {selectedRequest.method}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedRequest.url)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy URL"}</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                    Full Request URL
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-300 break-all">
                    {selectedRequest.url}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-neutral-400">
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 block text-[10px]">Type</span>
                    <span className="font-mono text-neutral-200">{selectedRequest.type}</span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 block text-[10px]">Duration</span>
                    <span className="font-mono text-neutral-200">{selectedRequest.duration ?? "—"} ms</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                      Response Body Preview (First X=200 Characters)
                    </div>
                    {selectedRequest.responseBodyPreview && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                        {selectedRequest.responseBodyPreview.length} chars
                      </span>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-emerald-400 whitespace-pre-wrap break-all">
                    {selectedRequest.responseBodyPreview
                      ? selectedRequest.responseBodyPreview
                      : selectedRequest.isPending
                        ? "Request in progress…"
                        : "[Empty or Non-string response]"}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-neutral-500">
                Select a network request to inspect its 15-char preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
