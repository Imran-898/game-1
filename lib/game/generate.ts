// ============================================================
// ZipRace – Puzzle Generator
// Generates solvable Hamiltonian-path puzzles with checkpoints.
// ============================================================

import type { Puzzle, Cell, Checkpoint, Wall } from './types';

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DIRS: Cell[] = [
  { r: -1, c: 0 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
  { r: 0, c: 1 },
];

function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

/**
 * Generate a Hamiltonian path on an N×N grid via randomized DFS.
 * Returns the path (ordered list of cells) or null if backtracking
 * exhausted all options (rare but possible for large N with time limit).
 */
function generateHamiltonianPath(N: number, rng: () => number): Cell[] | null {
  const total = N * N;
  const path: Cell[] = [];
  const visited = new Set<string>();

  function dfs(r: number, c: number): boolean {
    path.push({ r, c });
    visited.add(cellKey(r, c));

    if (path.length === total) return true;

    const dirs = shuffle(DIRS, rng);
    for (const d of dirs) {
      const nr = r + d.r;
      const nc = c + d.c;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && !visited.has(cellKey(nr, nc))) {
        if (dfs(nr, nc)) return true;
      }
    }

    path.pop();
    visited.delete(cellKey(r, c));
    return false;
  }

  const startR = Math.floor(rng() * N);
  const startC = Math.floor(rng() * N);
  if (dfs(startR, startC)) return path;
  return null;
}

/**
 * Place N evenly-spaced checkpoints along the Hamiltonian path.
 */
function placeCheckpoints(path: Cell[], numCheckpoints: number): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];
  const step = Math.floor(path.length / (numCheckpoints + 1));
  for (let i = 1; i <= numCheckpoints; i++) {
    const cell = path[step * i];
    checkpoints.push({ n: i, r: cell.r, c: cell.c });
  }
  return checkpoints;
}

/**
 * Generate walls along segments NOT on the canonical path.
 * For the specified wallCount, pick random non-path edges.
 */
function generateWalls(
  path: Cell[],
  N: number,
  wallCount: number,
  rng: () => number
): Wall[] {
  // Build a set of path edge keys (direction between consecutive cells)
  const pathEdges = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const key = `${Math.min(a.r, b.r)},${Math.min(a.c, b.c)},${a.r === b.r ? 'h' : 'v'}`;
    pathEdges.add(key);
  }

  // Collect all internal edges not on the path
  const candidates: Wall[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (c + 1 < N) {
        const key = `${r},${c},h`;
        if (!pathEdges.has(key)) {
          candidates.push({ r, c, side: 'right' });
        }
      }
      if (r + 1 < N) {
        const key = `${r},${c},v`;
        if (!pathEdges.has(key)) {
          candidates.push({ r, c, side: 'bottom' });
        }
      }
    }
  }

  const shuffled = shuffle(candidates, rng);
  return shuffled.slice(0, Math.min(wallCount, shuffled.length));
}

export interface GenerateOptions {
  gridSize?: number; // 4–8
  difficulty?: number; // 1–5
  seed?: number; // for determinism
}

/**
 * Main entry: generate a full puzzle.
 * Returns null if generation fails after max retries.
 */
export function generatePuzzle(options: GenerateOptions = {}): Puzzle | null {
  const { difficulty = 2, seed } = options;

  // Map difficulty to grid size and checkpoint count
  const gridSizeMap: Record<number, number> = { 1: 5, 2: 5, 3: 6, 4: 7, 5: 8 };
  const N = options.gridSize ?? gridSizeMap[difficulty] ?? 5;
  const numCheckpoints = Math.max(2, Math.min(N - 1, 2 + difficulty));
  const wallCount = difficulty <= 2 ? 0 : difficulty * 2;

  // Simple deterministic-ish RNG seeded by seed or Date.now()
  let s = seed ?? Date.now();
  const rng = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };

  for (let attempt = 0; attempt < 10; attempt++) {
    const path = generateHamiltonianPath(N, rng);
    if (!path) continue;

    const checkpoints = placeCheckpoints(path, numCheckpoints);
    const walls = wallCount > 0 ? generateWalls(path, N, wallCount, rng) : [];

    return {
      id: `generated-${Date.now()}`,
      grid_size: N,
      checkpoints,
      walls,
      difficulty,
    };
  }

  return null;
}

/** Generate today's daily puzzle deterministically from the date string */
export function generateDailyPuzzle(dateStr: string, difficulty = 3): Puzzle | null {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const puzzle = generatePuzzle({ difficulty, seed: Math.abs(hash) });
  if (puzzle) {
    puzzle.is_daily = true;
    puzzle.daily_date = dateStr;
  }
  return puzzle;
}
