import React, { useState, useEffect, useRef, useCallback } from "react";
import { Pause, Play, GripVertical, SlidersHorizontal } from "lucide-react";

export interface FloatingDraggablePauseButtonProps {
  isSetupPaused: boolean;
  onToggleSetupPause: () => void;
  className?: string;
}

const STORAGE_KEY_POS = "yt_floating_pause_pos";

interface Position {
  x: number;
  y: number;
}

export const FloatingDraggablePauseButton: React.FC<FloatingDraggablePauseButtonProps> = ({
  isSetupPaused,
  onToggleSetupPause,
  className = "",
}) => {
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_POS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
            return parsed;
          }
        }
      } catch {
        // Fallback to default position below
      }
      return {
        x: Math.max(16, window.innerWidth - 180),
        y: Math.max(16, window.innerHeight - 100),
      };
    }
    return { x: 200, y: 500 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const startPosRef = useRef<Position>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Clamps position inside viewport boundaries
  const clampPosition = useCallback((x: number, y: number): Position => {
    if (typeof window === "undefined") return { x, y };
    const btnWidth = buttonRef.current?.offsetWidth || 160;
    const btnHeight = buttonRef.current?.offsetHeight || 48;
    const maxX = Math.max(16, window.innerWidth - btnWidth - 16);
    const maxY = Math.max(16, window.innerHeight - btnHeight - 16);
    return {
      x: Math.min(maxX, Math.max(16, x)),
      y: Math.min(maxY, Math.max(16, y)),
    };
  }, []);

  // Window resize handler: keep button within screen bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPosition]);

  // Persist position whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position));
      } catch {
        // Ignore storage errors
      }
    }
  }, [position]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Left click only
    if (e.button !== 0) return;
    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
    startPosRef.current = { ...position };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMovedRef.current = true;
      }

      const nextX = startPosRef.current.x + dx;
      const nextY = startPosRef.current.y + dy;
      setPosition(clampPosition(nextX, nextY));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, clampPosition]);

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    dragStartRef.current = { clientX: touch.clientX, clientY: touch.clientY };
    startPosRef.current = { ...position };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !dragStartRef.current) return;
    const dx = touch.clientX - dragStartRef.current.clientX;
    const dy = touch.clientY - dragStartRef.current.clientY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }

    const nextX = startPosRef.current.x + dx;
    const nextY = startPosRef.current.y + dy;
    setPosition(clampPosition(nextX, nextY));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    // If movement occurred, treat as drag rather than tap
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onToggleSetupPause();
  };

  return (
    <div
      ref={buttonRef}
      data-testid="floating-draggable-pause-container"
      role="region"
      aria-label="Floating Setup Pause Controller"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
        zIndex: 9999,
      }}
      className={`select-none ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        data-testid="floating-pause-button"
        aria-pressed={isSetupPaused}
        aria-label={
          isSetupPaused
            ? "Setup Paused: Click to resume normal playback and auto-scroll"
            : "Pause for Setup: Freeze video, speech, and auto-scrolling to configure app"
        }
        onClick={handleClick}
        className={`flex items-center gap-2 rounded-full border px-3.5 py-2.5 shadow-2xl backdrop-blur-md transition-colors duration-150 ${
          isDragging ? "cursor-grabbing opacity-90 scale-105" : "cursor-grab"
        } ${
          isSetupPaused
            ? "border-amber-400 bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600 ring-2 ring-amber-400/50"
            : "border-border/60 bg-background/90 text-foreground hover:bg-accent hover:text-accent-foreground shadow-black/20"
        }`}
      >
        <GripVertical className="h-4 w-4 shrink-0 opacity-60" />

        {isSetupPaused ? (
          <div className="flex items-center gap-1.5 font-semibold text-xs whitespace-nowrap">
            <Pause className="h-4 w-4 fill-current shrink-0" />
            <span data-testid="floating-pause-status">Setup Paused</span>
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 opacity-80" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap">
            <Play className="h-3.5 w-3.5 fill-current shrink-0 text-primary" />
            <span data-testid="floating-pause-status">Pause for Setup</span>
          </div>
        )}
      </button>

      {/* Floating active setup indicator badge */}
      {isSetupPaused && (
        <div
          data-testid="floating-pause-badge"
          className="pointer-events-none mt-1 rounded bg-black/80 px-2 py-0.5 text-center text-[10px] font-semibold tracking-wide text-amber-300 shadow-sm"
        >
          Autoscroll & Play OFF
        </div>
      )}
    </div>
  );
};

export default FloatingDraggablePauseButton;
