// ============================================================
// ZipRace – Path Validation Engine
// Pure module – no side-effects, no I/O.
// Imported by both client (instant feedback) and server (authoritative).
// ============================================================

import type { Cell, Wall, WallSide, Puzzle, Path, ValidationResult } from './types';

// ---------- helpers ----------

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

function areAdjacent(a: Cell, b: Cell): boolean {
  return (Math.abs(a.r - b.r) + Math.abs(a.c - b.c)) === 1;
}

/**
 * Returns true if moving from `from` → `to` crosses a wall.
 * A wall on cell (r,c) side 'right' is the same physical barrier as
 * cell (r,c+1) side 'left', so we normalise to one canonical wall set.
 */
function crossesWall(from: Cell, to: Cell, wallSet: Set<string>): boolean {
  const dr = to.r - from.r;
  const dc = to.c - from.c;

  // Encode the wall as "cell that has the wall, and which side"
  // We always encode the wall on the lower-indexed cell for canonical form.
  let wallKey: string;
  if (dr === -1) {
    // moving up: from has a 'top' wall, or `to` has a 'bottom' wall
    wallKey = `${from.r},${from.c},top`;
  } else if (dr === 1) {
    // moving down: from has a 'bottom' wall
    wallKey = `${from.r},${from.c},bottom`;
  } else if (dc === -1) {
    // moving left: from has a 'left' wall
    wallKey = `${from.r},${from.c},left`;
  } else {
    // moving right: from has a 'right' wall
    wallKey = `${from.r},${from.c},right`;
  }

  return wallSet.has(wallKey);
}

/** Build a canonical wall set that includes both sides of each barrier */
function buildWallSet(walls: Wall[]): Set<string> {
  const set = new Set<string>();
  const opposite: Record<WallSide, WallSide> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };
  const delta: Record<WallSide, { dr: number; dc: number }> = {
    top: { dr: -1, dc: 0 },
    bottom: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
  };

  for (const w of walls) {
    set.add(`${w.r},${w.c},${w.side}`);
    // add mirror wall on adjacent cell
    const d = delta[w.side];
    set.add(`${w.r + d.dr},${w.c + d.dc},${opposite[w.side]}`);
  }
  return set;
}

// ---------- public API ----------

/**
 * Validate a player's path against the puzzle definition.
 *
 * Rules (from Appendix B):
 * 1. Path is a sequence of orthogonally adjacent cells.
 * 2. Visits every grid cell exactly once (Hamiltonian path).
 * 3. Passes through checkpoints in strictly ascending numeric order.
 * 4. No segment crosses a wall.
 * 5. Endpoints are unconstrained unless the puzzle pins start/end.
 */
export function validatePath(path: Path, puzzle: Puzzle): ValidationResult {
  const { grid_size: N, checkpoints, walls } = puzzle;
  const totalCells = N * N;

  // ── Rule 2 (pre-check): must cover all cells ──────────────────────────────
  if (path.length !== totalCells) {
    return { valid: false, reason: `Path covers ${path.length} cells but grid has ${totalCells}` };
  }

  const wallSet = buildWallSet(walls);
  const visited = new Set<string>();

  // Build checkpoint map: cellKey → checkpoint number
  const cpMap = new Map<string, number>();
  for (const cp of checkpoints) {
    cpMap.set(cellKey(cp.r, cp.c), cp.n);
  }
  const maxCheckpoint = Math.max(...checkpoints.map(cp => cp.n));
  let nextExpectedCheckpoint = 1;

  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    const key = cellKey(cell.r, cell.c);

    // ── Bounds check ─────────────────────────────────────────────────────────
    if (cell.r < 0 || cell.r >= N || cell.c < 0 || cell.c >= N) {
      return { valid: false, reason: `Cell (${cell.r},${cell.c}) is out of bounds` };
    }

    // ── Rule 2 (no repeats) ──────────────────────────────────────────────────
    if (visited.has(key)) {
      return { valid: false, reason: `Cell (${cell.r},${cell.c}) visited more than once` };
    }
    visited.add(key);

    // ── Rule 1 (adjacency) ────────────────────────────────────────────────────
    if (i > 0 && !areAdjacent(path[i - 1], cell)) {
      return {
        valid: false,
        reason: `Cells (${path[i - 1].r},${path[i - 1].c}) and (${cell.r},${cell.c}) are not adjacent`,
      };
    }

    // ── Rule 4 (walls) ────────────────────────────────────────────────────────
    if (i > 0 && crossesWall(path[i - 1], cell, wallSet)) {
      return {
        valid: false,
        reason: `Segment from (${path[i - 1].r},${path[i - 1].c}) to (${cell.r},${cell.c}) crosses a wall`,
      };
    }

    // ── Rule 3 (checkpoint order) ─────────────────────────────────────────────
    const cpNum = cpMap.get(key);
    if (cpNum !== undefined) {
      if (cpNum !== nextExpectedCheckpoint) {
        return {
          valid: false,
          reason: `Expected checkpoint ${nextExpectedCheckpoint} but encountered checkpoint ${cpNum}`,
        };
      }
      nextExpectedCheckpoint++;
    }
  }

  // ── All checkpoints visited ───────────────────────────────────────────────
  if (nextExpectedCheckpoint !== maxCheckpoint + 1) {
    return { valid: false, reason: `Not all checkpoints were visited` };
  }

  return { valid: true };
}

/** Quick partial validation (for real-time drawing feedback). Only checks steps 1 & 4. */
export function validatePartialPath(path: Path, puzzle: Puzzle): ValidationResult {
  const { grid_size: N, walls } = puzzle;
  const wallSet = buildWallSet(walls);
  const visited = new Set<string>();

  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    const key = cellKey(cell.r, cell.c);

    if (cell.r < 0 || cell.r >= N || cell.c < 0 || cell.c >= N) {
      return { valid: false, reason: 'Out of bounds' };
    }
    if (visited.has(key)) {
      return { valid: false, reason: 'Cell visited twice' };
    }
    visited.add(key);

    if (i > 0) {
      if (!areAdjacent(path[i - 1], cell)) {
        return { valid: false, reason: 'Non-adjacent cells' };
      }
      if (crossesWall(path[i - 1], cell, wallSet)) {
        return { valid: false, reason: 'Crosses wall' };
      }
    }
  }
  return { valid: true };
}
