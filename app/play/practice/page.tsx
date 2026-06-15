'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { generatePuzzle } from '@/lib/game/generate';
import { validatePath } from '@/lib/game/validate';
import Grid from '@/components/Grid';
import type { Puzzle, Path } from '@/lib/game/types';

export default function PracticePage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [difficulty, setDifficulty] = useState(2);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const newPuzzle = useCallback((diff: number) => {
    const p = generatePuzzle({ difficulty: diff });
    setPuzzle(p);
    setSolved(false);
    setElapsed(0);
    startRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current!) / 1000));
    }, 1000);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => newPuzzle(difficulty));
    return () => {
      cancelAnimationFrame(id);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty, newPuzzle]);

  function handleSolve(path: Path) {
    if (!puzzle) return;
    const result = validatePath(path, puzzle);
    if (result.valid) {
      setSolved(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1rem',
        gap: '1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Practice</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No pressure. No timer. Unlimited puzzles.
        </p>
      </div>

      {/* Difficulty */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map(d => (
          <button
            key={d}
            id={`difficulty-${d}`}
            onClick={() => setDifficulty(d)}
            style={{
              padding: '0.375rem 1rem',
              borderRadius: '100px',
              border: '1px solid',
              borderColor: difficulty === d ? 'var(--color-brand-500)' : 'var(--border-color)',
              background: difficulty === d ? 'rgba(99,102,241,0.2)' : 'var(--bg-card)',
              color: difficulty === d ? 'var(--color-brand-400)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {['Easy', 'Normal', 'Hard', 'Expert', 'Master'][d - 1]}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
        {formatTime(elapsed)}
      </div>

      {/* Grid */}
      {puzzle && (
        <motion.div key={puzzle.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <Grid puzzle={puzzle} onSolve={handleSolve} disabled={solved} />
        </motion.div>
      )}

      {/* Solved state */}
      {solved && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '1.5rem 2rem',
            textAlign: 'center',
            borderColor: 'rgba(52,211,153,0.4)',
            boxShadow: '0 0 30px rgba(52,211,153,0.15)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.25rem' }}>Solved!</div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Time: <strong style={{ color: 'var(--text-primary)' }}>{formatTime(elapsed)}</strong>
          </div>
          <button
            id="new-puzzle-btn"
            className="btn-primary"
            onClick={() => newPuzzle(difficulty)}
          >
            Next Puzzle
          </button>
        </motion.div>
      )}

      {/* New puzzle button */}
      {!solved && puzzle && (
        <button
          id="skip-puzzle-btn"
          className="btn-ghost"
          onClick={() => newPuzzle(difficulty)}
          style={{ fontSize: '0.875rem' }}
        >
          Skip puzzle
        </button>
      )}
    </div>
  );
}
