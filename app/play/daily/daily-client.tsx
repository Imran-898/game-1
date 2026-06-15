'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Grid from '@/components/Grid';
import { validatePath } from '@/lib/game/validate';
import type { Puzzle, Path } from '@/lib/game/types';
import { Calendar, Share2 } from 'lucide-react';

interface Props {
  puzzle: Puzzle | null;
  today: string;
  priorResult: { solve_ms: number | null; completed: boolean } | null;
  userId?: string;
}

export default function DailyClient({ puzzle, today, priorResult, userId }: Props) {
  const [solved, setSolved] = useState(!!priorResult?.completed);
  const [solveMs, setSolveMs] = useState<number | null>(priorResult?.solve_ms ?? null);
  const [elapsed, setElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(!!priorResult?.completed);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (solved) return;
    startRef.current = Date.now();
    timerRef.current = setInterval(() =>
      setElapsed(Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000)), 1000
    );
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [solved]);

  async function handleSolve(path: Path) {
    if (!puzzle || solved) return;
    const result = validatePath(path, puzzle);
    if (!result.valid) return;

    const ms = Date.now() - (startRef.current ?? Date.now());
    setSolveMs(ms);
    setSolved(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Submit to server
    const res = await fetch('/api/daily/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puzzleId: puzzle.id, dailyDate: today, solveMs: ms, path }),
    });
    if (res.ok) setSubmitted(true);
  }

  function shareResult() {
    const time = solveMs ? `${(solveMs / 1000).toFixed(1)}s` : 'N/A';
    const text = `I solved today's ZipRace Daily in ${time}! 🧩⚡\nPlay at ziprace.app`;
    if (navigator.share) {
      navigator.share({ title: 'ZipRace Daily', text });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
    }
  }

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!puzzle) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No daily puzzle available. Check back later!</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem', gap: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Calendar size={18} color="var(--color-brand-400)" />
            <h1 style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>Daily Puzzle</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{today}</p>
        </div>
        {solved && (
          <button id="share-btn" className="btn-secondary" onClick={shareResult} style={{ fontSize: '0.85rem', gap: '0.4rem' }}>
            <Share2 size={14} /> Share
          </button>
        )}
      </div>

      {/* Timer */}
      {!solved && (
        <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {formatTime(elapsed)}
        </div>
      )}

      {/* Grid */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
        <Grid puzzle={puzzle} onSolve={handleSolve} disabled={solved} />
      </motion.div>

      {/* Result */}
      {solved && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '1.5rem 2rem', textAlign: 'center', maxWidth: '400px', width: '100%', borderColor: 'rgba(52,211,153,0.4)', boxShadow: '0 0 30px rgba(52,211,153,0.15)' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.25rem' }}>
            {priorResult?.completed && !submitted ? 'Already Completed' : 'Solved!'}
          </div>
          {solveMs && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.25rem' }}>
              Time: <strong style={{ color: 'var(--color-accent-400)', fontSize: '1.25rem' }}>
                {(solveMs / 1000).toFixed(2)}s
              </strong>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button id="share-result-btn" className="btn-primary" onClick={shareResult}>
              <Share2 size={16} /> Share Result
            </button>
            <a href="/play" className="btn-secondary" style={{ fontSize: '0.875rem' }}>
              Play More
            </a>
          </div>
        </motion.div>
      )}

      {/* Login prompt */}
      {solved && !userId && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
          <a href="/auth/signup" style={{ color: 'var(--color-brand-400)', textDecoration: 'none', fontWeight: 600 }}>
            Create an account
          </a>{' '}
          to save your streak!
        </p>
      )}
    </div>
  );
}
