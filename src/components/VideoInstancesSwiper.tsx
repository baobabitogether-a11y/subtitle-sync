import React, { useRef, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Play,
  Layers,
} from "lucide-react";
import { VideoInstanceConfig, saveVideoInstanceConfig } from "@/utils/multiVideoPlayerManager";

export interface VideoInstancesSwiperProps {
  instances: VideoInstanceConfig[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  renderPlayerContainer: (instance: VideoInstanceConfig, index: number) => React.ReactNode;
  activePlayingId?: string;
  videoId?: string;
  onConfigChange?: (instanceId: string, updates: Partial<VideoInstanceConfig>) => void;
  className?: string;
}

/**
 * VideoInstancesSwiper
 * A horizontal swipeable carousel for multi-instance YouTube video elements.
 * Allows managing separate video instances per language (e.g., Primary + one per spoken language)
 * with independent settings, YouTube audio track setup guidance, and touch/button navigation.
 */
export const VideoInstancesSwiper: React.FC<VideoInstancesSwiperProps> = ({
  instances,
  activeIndex,
  onActiveIndexChange,
  renderPlayerContainer,
  activePlayingId,
  videoId = "",
  onConfigChange,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const [localConfigs, setLocalConfigs] = useState<Record<string, VideoInstanceConfig>>({});

  // Sync internal configs from instances
  useEffect(() => {
    const map: Record<string, VideoInstanceConfig> = {};
    for (const inst of instances) {
      map[inst.id] = { ...inst };
    }
    setLocalConfigs(map);
  }, [instances]);

  // Safe navigation bounds
  const count = instances.length;
  const currentIndex = Math.max(0, Math.min(activeIndex, Math.max(0, count - 1)));

  const goToSlide = (index: number) => {
    if (index >= 0 && index < count) {
      onActiveIndexChange(index);
    }
  };

  const handlePrev = () => {
    goToSlide(currentIndex - 1);
  };

  const handleNext = () => {
    goToSlide(currentIndex + 1);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    const threshold = 50; // min 50px swipe
    if (touchDeltaX.current < -threshold) {
      handleNext();
    } else if (touchDeltaX.current > threshold) {
      handlePrev();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const toggleManualTrackConfigured = (instance: VideoInstanceConfig) => {
    const updatedStatus = !localConfigs[instance.id]?.manualTrackConfigured;
    const updates: Partial<VideoInstanceConfig> = {
      manualTrackConfigured: updatedStatus,
    };
    setLocalConfigs((prev) => ({
      ...prev,
      [instance.id]: {
        ...(prev[instance.id] || instance),
        manualTrackConfigured: updatedStatus,
      },
    }));
    saveVideoInstanceConfig(videoId, instance.id, updates);
    onConfigChange?.(instance.id, updates);
  };

  const currentInstance = instances[currentIndex] || instances[0];
  const currentConfig = (currentInstance && localConfigs[currentInstance.id]) || currentInstance;

  if (!instances || instances.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="video-instances-swiper"
      className={`flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    >
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="font-semibold" data-testid="swiper-current-label">
            {currentInstance.label}
          </span>
          {currentInstance.isPrimary ? (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Primary
            </span>
          ) : (
            <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              Track: {currentInstance.languageName || currentInstance.languageCode.toUpperCase()}
            </span>
          )}
          {activePlayingId === currentInstance.id && (
            <span
              data-testid="swiper-active-playing-badge"
              className="flex items-center gap-1 rounded bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400"
            >
              <Play className="h-3 w-3 fill-current" />
              Active Audio
            </span>
          )}
        </div>

        {/* Carousel Prev/Next & Slide Indicator Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous video instance"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span
            data-testid="swiper-counter"
            className="px-1 text-xs text-muted-foreground select-none"
          >
            {currentIndex + 1} / {count}
          </span>

          <button
            type="button"
            aria-label="Next video instance"
            onClick={handleNext}
            disabled={currentIndex === count - 1}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Slide Carousel Track */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden bg-black aspect-video select-none"
      >
        <div
          data-testid="swiper-slider-track"
          className="flex h-full w-full transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {instances.map((instance, index) => (
            <div
              key={instance.id}
              data-testid={`swiper-slide-${instance.id}`}
              className="relative h-full w-full shrink-0 grow-0"
              style={{ width: "100%" }}
            >
              {renderPlayerContainer(instance, index)}
            </div>
          ))}
        </div>
      </div>

      {/* Slide Indicators / Tabs */}
      {count > 1 && (
        <div
          data-testid="swiper-indicators"
          className="flex items-center justify-center gap-1.5 border-t bg-muted/20 px-3 py-2"
        >
          {instances.map((instance, index) => {
            const isCurrent = index === currentIndex;
            const isPlaying = activePlayingId === instance.id;
            return (
              <button
                key={instance.id}
                type="button"
                aria-label={`Switch to ${instance.label}`}
                onClick={() => goToSlide(index)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                <span>{instance.isPrimary ? "Primary" : instance.languageCode.toUpperCase()}</span>
                {isPlaying && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Instance-Specific YouTube Audio Track Guidance & Isolated Controls */}
      <div className="border-t bg-card p-3 text-xs">
        {currentInstance.isPrimary ? (
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>Primary video element plays standard original audio track.</span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground/80">
              Settings remembered independently
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2">
                <Settings className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    Native YouTube Audio Track Configuration for{" "}
                    {currentInstance.languageName || currentInstance.languageCode.toUpperCase()}
                  </p>
                  <p className="text-muted-foreground">
                    Click the YouTube gear icon (⚙️) inside this player slide and choose the{" "}
                    <b>
                      {currentInstance.languageName || currentInstance.languageCode.toUpperCase()}
                    </b>{" "}
                    audio track.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid={`toggle-configured-${currentInstance.id}`}
                  onClick={() => toggleManualTrackConfigured(currentInstance)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    currentConfig?.manualTrackConfigured
                      ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border border-green-300 dark:border-green-800"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  }`}
                >
                  {currentConfig?.manualTrackConfigured ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      Track Configured
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      Mark Configured
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default VideoInstancesSwiper;
