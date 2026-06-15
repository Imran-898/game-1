// ============================================================
// ZipRace – Validation Unit Tests (Vitest)
// ============================================================

import { describe, it, expect } from 'vitest';
import { validatePath, validatePartialPath } from './validate';
import type { Puzzle, Path } from './types';

// Simple 3×3 puzzle with checkpoints at corners
const simplePuzzle: Puzzle = {
  id: 'test-1',
  grid_size: 3,
  checkpoints: [
    { n: 1, r: 0, c: 0 },
    { n: 2, r: 2, c: 2 },
  ],
  walls: [],
  difficulty: 1,
};

// Valid snake path: 0,0 → 0,1 → 0,2 → 1,2 → 1,1 → 1,0 → 2,0 → 2,1 → 2,2
const validPath: Path = [
  { r: 0, c: 0 }, // checkpoint 1
  { r: 0, c: 1 },
  { r: 0, c: 2 },
  { r: 1, c: 2 },
  { r: 1, c: 1 },
  { r: 1, c: 0 },
  { r: 2, c: 0 },
  { r: 2, c: 1 },
  { r: 2, c: 2 }, // checkpoint 2
];

describe('validatePath', () => {
  it('accepts a valid complete path', () => {
    const result = validatePath(validPath, simplePuzzle);
    expect(result.valid).toBe(true);
  });

  it('rejects a path that does not cover all cells', () => {
    const shortPath = validPath.slice(0, 7);
    const result = validatePath(shortPath, simplePuzzle);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('covers');
  });

  it('rejects a path that revisits a cell', () => {
    const repeatingPath: Path = [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: 0 }, // repeat!
      { r: 0, c: 2 },
      { r: 1, c: 2 },
      { r: 1, c: 1 },
      { r: 1, c: 0 },
      { r: 2, c: 0 },
      { r: 2, c: 1 },
    ];
    const result = validatePath(repeatingPath, simplePuzzle);
    expect(result.valid).toBe(false);
  });

  it('rejects a path with non-adjacent cells', () => {
    const jumpPath: Path = [
      { r: 0, c: 0 },
      { r: 0, c: 2 }, // jump!
      { r: 0, c: 1 },
      { r: 1, c: 2 },
      { r: 1, c: 1 },
      { r: 1, c: 0 },
      { r: 2, c: 0 },
      { r: 2, c: 1 },
      { r: 2, c: 2 },
    ];
    const result = validatePath(jumpPath, simplePuzzle);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('adjacent');
  });

  it('rejects a path that skips a checkpoint', () => {
    // Puzzle where checkpoints must be visited in order 1→2→3
    const puzzle3cp: Puzzle = {
      id: 'test-cp3',
      grid_size: 3,
      checkpoints: [
        { n: 1, r: 0, c: 0 },
        { n: 2, r: 1, c: 1 },
        { n: 3, r: 2, c: 2 },
      ],
      walls: [],
      difficulty: 1,
    };
    // Path that goes to checkpoint 3 before 2
    const wrongOrderPath: Path = [
      { r: 0, c: 0 }, // cp 1 ✓
      { r: 1, c: 0 },
      { r: 2, c: 0 },
      { r: 2, c: 1 },
      { r: 2, c: 2 }, // cp 3 encountered before cp 2 ✗
      { r: 1, c: 2 },
      { r: 0, c: 2 },
      { r: 0, c: 1 },
      { r: 1, c: 1 }, // cp 2 too late
    ];
    const result = validatePath(wrongOrderPath, puzzle3cp);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('checkpoint');
  });

  it('rejects a path that crosses a wall', () => {
    const puzzleWithWall: Puzzle = {
      ...simplePuzzle,
      // Wall on right side of (0,0) = blocks move from (0,0) to (0,1)
      walls: [{ r: 0, c: 0, side: 'right' }],
    };
    const result = validatePath(validPath, puzzleWithWall);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('wall');
  });

  it('accepts path that avoids a wall', () => {
    const puzzleWithWall: Puzzle = {
      ...simplePuzzle,
      walls: [{ r: 0, c: 0, side: 'right' }],
    };
    // Go down first to avoid the wall
    const altPath: Path = [
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 2, c: 0 },
      { r: 2, c: 1 },
      { r: 1, c: 1 },
      { r: 0, c: 1 },
      { r: 0, c: 2 },
      { r: 1, c: 2 },
      { r: 2, c: 2 },
    ];
    const result = validatePath(altPath, puzzleWithWall);
    expect(result.valid).toBe(true);
  });
});

describe('validatePartialPath', () => {
  it('accepts a valid partial path', () => {
    const partial: Path = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }];
    expect(validatePartialPath(partial, simplePuzzle).valid).toBe(true);
  });

  it('rejects a partial path crossing a wall', () => {
    const puzzleWithWall: Puzzle = {
      ...simplePuzzle,
      walls: [{ r: 0, c: 0, side: 'right' }],
    };
    const partial: Path = [{ r: 0, c: 0 }, { r: 0, c: 1 }];
    const result = validatePartialPath(partial, puzzleWithWall);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('wall');
  });
});
