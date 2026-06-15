'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Puzzle, Path, Cell } from '@/lib/game/types';
import { validatePartialPath } from '@/lib/game/validate';

interface GridProps {
  puzzle: Puzzle;
  onPathChange?: (path: Path) => void;
  onSolve?: (path: Path) => void;
  disabled?: boolean;
  /** Show opponent overlays (coarse progress, no paths) */
  opponentProgress?: Array<{ userId: string; progress: number; color: string }>;
}

function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

export default function Grid({ puzzle, onPathChange, onSolve, disabled }: GridProps) {
  const { grid_size: N, checkpoints, walls } = puzzle;
  const [path, setPath] = useState<Path>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Use a consistent default so server and client produce identical initial HTML.
  // The effect updates it once the real viewport is known on the client.
  const [cellSize, setCellSize] = useState(Math.min(Math.floor(480 / N), 80));

  useEffect(() => {
    function update() {
      setCellSize(
        Math.min(Math.floor(Math.min(window.innerWidth - 64, 480) / N), 80)
      );
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [N]);

  // Build lookup sets
  const pathSet = new Set(path.map(c => cellKey(c.r, c.c)));
  const cpMap = new Map(checkpoints.map(cp => [cellKey(cp.r, cp.c), cp]));

  // Wall lookup
  const wallSet = new Set<string>();
  for (const w of walls) {
    wallSet.add(`${w.r},${w.c},${w.side}`);
  }

  function hasWall(r: number, c: number, side: string): boolean {
    return wallSet.has(`${r},${c},${side}`);
  }

  function getLastPathIndex(r: number, c: number): number {
    return path.findIndex(c2 => c2.r === r && c2.c === c);
  }

  function extendPath(r: number, c: number) {
    if (disabled) return;
    const last = path[path.length - 1];

    // If the cell is already on the path (not the last), truncate to it
    const existingIdx = path.findIndex(c2 => c2.r === r && c2.c === c);
    if (existingIdx !== -1 && existingIdx < path.length - 1) {
      const newPath = path.slice(0, existingIdx + 1);
      setPath(newPath);
      onPathChange?.(newPath);
      return;
    }

    // Don't allow non-adjacent
    if (last && Math.abs(last.r - r) + Math.abs(last.c - c) !== 1) return;
    // Don't revisit
    if (pathSet.has(cellKey(r, c))) return;

    const newPath = [...path, { r, c }];
    const validation = validatePartialPath(newPath, puzzle);
    if (!validation.valid) {
      setError(true);
      setTimeout(() => setError(false), 400);
      return;
    }

    setPath(newPath);
    onPathChange?.(newPath);

    // Trigger haptics
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const cp = cpMap.get(cellKey(r, c));
      navigator.vibrate(cp ? 30 : 5);
    }

    // Check complete
    if (newPath.length === N * N) {
      onSolve?.(newPath);
    }
  }

  function startPath(r: number, c: number) {
    if (disabled) return;
    // If clicking the current last cell, allow retract (handled in pointer move)
    setPath([{ r, c }]);
    setIsDragging(true);
    onPathChange?.([{ r, c }]);
  }

  function reset() {
    setPath([]);
    onPathChange?.([]);
  }

  // Pointer event handlers
  function getCellFromPoint(x: number, y: number): Cell | null {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = x - rect.left;
    const relY = y - rect.top;
    const gap = 3;
    const total = cellSize + gap;
    const c = Math.floor(relX / total);
    const r = Math.floor(relY / total);
    if (r >= 0 && r < N && c >= 0 && c < N) return { r, c };
    return null;
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) startPath(cell.r, cell.c);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (cell) extendPath(cell.r, cell.c);
  }

  function handlePointerUp() {
    setIsDragging(false);
  }

  // Keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled) return;
    const last = path[path.length - 1];
    const dirs: Record<string, Cell> = {
      ArrowUp: { r: -1, c: 0 },
      ArrowDown: { r: 1, c: 0 },
      ArrowLeft: { r: 0, c: -1 },
      ArrowRight: { r: 0, c: 1 },
    };

    if (e.key in dirs) {
      e.preventDefault();
      if (!last) { startPath(0, 0); return; }
      const d = dirs[e.key];
      extendPath(last.r + d.r, last.c + d.c);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      const newPath = path.slice(0, -1);
      setPath(newPath);
      onPathChange?.(newPath);
    } else if (e.key.toLowerCase() === 'r') {
      reset();
    } else if (e.key === 'Enter' && path.length === N * N) {
      onSolve?.(path);
    }
  }, [path, disabled, N]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const gap = 3;
  const gridPx = N * cellSize + (N - 1) * gap;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div
        ref={containerRef}
        role="grid"
        aria-label="ZipRace puzzle grid"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${N}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${N}, ${cellSize}px)`,
          gap: `${gap}px`,
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: `2px solid ${error ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`,
          transition: 'border-color 0.2s',
          userSelect: 'none',
          touchAction: 'none',
          cursor: disabled ? 'default' : 'crosshair',
          boxShadow: error ? '0 0 20px rgba(239,68,68,0.2)' : 'var(--shadow-glow)',
          width: `${gridPx + 32}px`,
        }}
      >
        {Array.from({ length: N * N }, (_, idx) => {
          const r = Math.floor(idx / N);
          const c = idx % N;
          const key = cellKey(r, c);
          const isOnPath = pathSet.has(key);
          const pathIdx = isOnPath ? getLastPathIndex(r, c) : -1;
          const isLast = pathIdx === path.length - 1;
          const cp = cpMap.get(key);
          const isVisitedCp = cp && isOnPath;

          // Wall borders
          const borderTop = hasWall(r, c, 'top') ? '3px solid rgba(239,68,68,0.7)' : undefined;
          const borderRight = hasWall(r, c, 'right') ? '3px solid rgba(239,68,68,0.7)' : undefined;
          const borderBottom = hasWall(r, c, 'bottom') ? '3px solid rgba(239,68,68,0.7)' : undefined;
          const borderLeft = hasWall(r, c, 'left') ? '3px solid rgba(239,68,68,0.7)' : undefined;

          return (
            <motion.div
              key={key}
              role="gridcell"
              aria-label={cp ? `Checkpoint ${cp.n}` : `Cell row ${r + 1} col ${c + 1}`}
              initial={false}
              animate={{
                scale: isLast ? 1.08 : isOnPath ? 1 : 0.95,
                opacity: 1,
              }}
              transition={{ duration: 0.08 }}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 8,
                background: isOnPath
                  ? `rgba(99, 102, 241, ${isLast ? 0.8 : 0.45})`
                  : 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderTopWidth: borderTop ? '3px' : undefined,
                borderRightWidth: borderRight ? '3px' : undefined,
                borderBottomWidth: borderBottom ? '3px' : undefined,
                borderLeftWidth: borderLeft ? '3px' : undefined,
                borderTopColor: borderTop ? 'rgba(239,68,68,0.7)' : undefined,
                borderRightColor: borderRight ? 'rgba(239,68,68,0.7)' : undefined,
                borderBottomColor: borderBottom ? 'rgba(239,68,68,0.7)' : undefined,
                borderLeftColor: borderLeft ? 'rgba(239,68,68,0.7)' : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: cp ? `${Math.max(12, cellSize * 0.35)}px` : '0',
                fontWeight: 900,
                color: isVisitedCp ? 'white' : cp ? 'var(--color-brand-400)' : 'transparent',
                boxShadow: isLast
                  ? '0 0 16px rgba(99,102,241,0.7)'
                  : cp && isOnPath
                  ? '0 0 12px rgba(99,102,241,0.5)'
                  : 'none',
                position: 'relative',
                transition: 'background 0.1s, box-shadow 0.1s',
              }}
            >
              {/* Checkpoint marker */}
              {cp && (
                <div
                  style={{
                    width: '70%',
                    height: '70%',
                    borderRadius: '50%',
                    background: isVisitedCp
                      ? 'var(--color-brand-500)'
                      : 'rgba(99,102,241,0.2)',
                    border: '2px solid',
                    borderColor: isVisitedCp ? 'var(--color-brand-300)' : 'var(--color-brand-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: `${Math.max(10, cellSize * 0.3)}px`,
                    fontWeight: 900,
                    color: isVisitedCp ? 'white' : 'var(--color-brand-400)',
                    boxShadow: cp ? `0 0 10px rgba(99,102,241,${isVisitedCp ? 0.6 : 0.2})` : 'none',
                  }}
                >
                  {cp.n}
                </div>
              )}
              {/* Path indicator dot for non-checkpoint cells on path */}
              {isOnPath && !cp && (
                <div
                  style={{
                    width: '30%',
                    height: '30%',
                    borderRadius: '50%',
                    background: 'rgba(99,102,241,0.8)',
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          id="grid-reset"
          className="btn-ghost"
          onClick={reset}
          disabled={disabled || path.length === 0}
          style={{ fontSize: '0.85rem' }}
        >
          ↺ Reset (R)
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {path.length}/{N * N} cells
        </span>
        <button
          id="grid-undo"
          className="btn-ghost"
          onClick={() => {
            const newPath = path.slice(0, -1);
            setPath(newPath);
            onPathChange?.(newPath);
          }}
          disabled={disabled || path.length === 0}
          style={{ fontSize: '0.85rem' }}
        >
          ⌫ Undo
        </button>
      </div>
    </div>
  );
}
