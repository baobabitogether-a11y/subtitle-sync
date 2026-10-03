import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BookmarkPlus,
  Play,
  Trash2,
  Search,
  RotateCcw,
  Check,
  Video,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { DEFAULT_LIBRARY_ITEMS, STORAGE_KEYS } from "../config/appConfig";
import { LibraryVideoItem } from "../types";

export interface VideoLibraryPanelProps {
  currentVideoId: string;
  onSelectVideo: (videoId: string, title?: string) => void;
  className?: string;
}

export const VideoLibraryPanel: React.FC<VideoLibraryPanelProps> = ({
  currentVideoId,
  onSelectVideo,
  className = "",
}) => {
  const [library, setLibrary] = useState<LibraryVideoItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LIBRARY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LibraryVideoItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_e) {
      // Fallback to default items
    }
    return DEFAULT_LIBRARY_ITEMS;
  });

  const [search, setSearch] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  // Sync library changes to localStorage
  const persistLibrary = useCallback((items: LibraryVideoItem[]) => {
    setLibrary(items);
    try {
      localStorage.setItem(STORAGE_KEYS.LIBRARY_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("[VideoLibraryPanel] Failed to save library to localStorage:", e);
    }
  }, []);

  // Automatically record current video into watch history if not present, or refresh timestamp
  useEffect(() => {
    if (!currentVideoId) return;

    setLibrary((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === currentVideoId);
      let updated: LibraryVideoItem[];
      if (existingIndex >= 0) {
        // Refresh timestamp and move to front
        const item = { ...prev[existingIndex], timestamp: Date.now() };
        updated = [item, ...prev.filter((_, idx) => idx !== existingIndex)];
      } else {
        const newItem: LibraryVideoItem = {
          id: currentVideoId,
          originalUrl: `https://www.youtube.com/watch?v=${currentVideoId}`,
          title: `YouTube Video · ${currentVideoId}`,
          cues: [],
          timestamp: Date.now(),
        };
        updated = [newItem, ...prev];
      }
      try {
        localStorage.setItem(STORAGE_KEYS.LIBRARY_STORAGE_KEY, JSON.stringify(updated));
      } catch (_e) {
        // ignore storage errors
      }
      return updated;
    });
  }, [currentVideoId]);

  const handleSaveCurrent = () => {
    if (!currentVideoId) return;
    const existing = library.find((i) => i.id === currentVideoId);
    if (!existing) {
      const newItem: LibraryVideoItem = {
        id: currentVideoId,
        originalUrl: `https://www.youtube.com/watch?v=${currentVideoId}`,
        title: `YouTube Video · ${currentVideoId}`,
        cues: [],
        timestamp: Date.now(),
      };
      persistLibrary([newItem, ...library]);
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleRemove = (id: string) => {
    const updated = library.filter((item) => item.id !== id);
    persistLibrary(updated);
  };

  const handleResetDefaults = () => {
    persistLibrary(DEFAULT_LIBRARY_ITEMS);
  };

  const handleClearAll = () => {
    persistLibrary([]);
  };

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return library;
    return library.filter(
      (item) => item.title.toLowerCase().includes(query) || item.id.toLowerCase().includes(query),
    );
  }, [library, search]);

  const isCurrentSaved = library.some((item) => item.id === currentVideoId);

  return (
    <div
      id="video-library-panel"
      data-testid="video-library-panel"
      className={`space-y-4 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold leading-none">Video Watch Library</h3>
          <span
            id="library-count-badge"
            data-testid="library-count-badge"
            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {library.length} {library.length === 1 ? "video" : "videos"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="save-current-video-btn"
            data-testid="save-current-video-btn"
            size="sm"
            variant={isCurrentSaved ? "outline" : "default"}
            onClick={handleSaveCurrent}
            className="gap-1.5 text-xs"
          >
            {justSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Saved!</span>
              </>
            ) : isCurrentSaved ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>In Library</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="h-3.5 w-3.5" />
                <span>Save Current</span>
              </>
            )}
          </Button>
          <Button
            id="reset-library-defaults-btn"
            data-testid="reset-library-defaults-btn"
            size="sm"
            variant="ghost"
            onClick={handleResetDefaults}
            title="Reset to default educational videos"
            className="text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          {library.length > 0 && (
            <Button
              id="clear-library-btn"
              data-testid="clear-library-btn"
              size="sm"
              variant="ghost"
              onClick={handleClearAll}
              title="Clear all videos"
              className="text-xs text-destructive hover:bg-destructive/10"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          id="library-search-input"
          data-testid="library-search-input"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved videos by title or ID..."
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div
          id="library-empty-state"
          data-testid="library-empty-state"
          className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground"
        >
          <Video className="mb-2 h-8 w-8 stroke-1" />
          <p className="text-sm font-medium">No videos found</p>
          <p className="text-xs">
            {search
              ? "Try searching with a different term."
              : "Play a YouTube video or click 'Save Current' to add it to your library."}
          </p>
          {search && (
            <Button
              size="sm"
              variant="link"
              onClick={() => setSearch("")}
              className="mt-1 text-xs"
            >
              Clear filter
            </Button>
          )}
        </div>
      ) : (
        <div
          id="library-items-list"
          data-testid="library-items-list"
          className="grid max-h-[380px] gap-2 overflow-y-auto pr-1"
        >
          {filteredItems.map((item) => {
            const isCurrent = item.id === currentVideoId;
            return (
              <div
                key={item.id}
                id={`library-item-${item.id}`}
                data-testid={`library-item-${item.id}`}
                className={`flex items-center justify-between gap-3 rounded-md border p-2 text-sm transition-colors ${
                  isCurrent
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative aspect-video w-16 shrink-0 overflow-hidden rounded bg-muted sm:w-20">
                    <img
                      src={`https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`}
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => {
                        // Fallback placeholder on image load failure
                        (e.target as HTMLElement).style.display = "none";
                      }}
                      className="h-full w-full object-cover"
                    />
                    {isCurrent && (
                      <span className="absolute bottom-1 right-1 rounded bg-primary px-1 text-[9px] font-bold uppercase text-primary-foreground">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-xs font-medium text-foreground sm:text-sm">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-mono text-[10px] text-primary/80">#{item.id}</span>
                      {item.timestamp && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      )}
                      {item.cues && item.cues.length > 0 && (
                        <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                          <Sparkles className="h-3 w-3" />
                          {item.cues.length} cues
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    id={`load-library-video-${item.id}`}
                    data-testid={`load-library-video-${item.id}`}
                    size="sm"
                    variant={isCurrent ? "secondary" : "default"}
                    onClick={() => onSelectVideo(item.id, item.title)}
                    className="h-8 gap-1 px-2.5 text-xs"
                    disabled={isCurrent}
                  >
                    <Play className="h-3 w-3" />
                    <span className="hidden sm:inline">{isCurrent ? "Playing" : "Load"}</span>
                  </Button>
                  <Button
                    id={`remove-library-video-${item.id}`}
                    data-testid={`remove-library-video-${item.id}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(item.id)}
                    title="Remove from library"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
