'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Users, Lock, Globe } from 'lucide-react';

export default function CreateRoomPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'casual' | 'ranked' | 'private'>('casual');
  const [difficulty, setDifficulty] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, difficulty, maxPlayers }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error?.message ?? 'Failed to create room. Please sign in first.');
      setLoading(false);
      return;
    }
    const { code } = await res.json();
    router.push(`/play/room/${code}`);
  }

  const modeOptions = [
    { id: 'casual', label: 'Casual', icon: Globe, desc: 'No rating change, relaxed rules' },
    { id: 'ranked', label: 'Ranked', icon: Trophy, desc: 'ELO rating on the line' },
    { id: 'private', label: 'Private', icon: Lock, desc: 'Friends only, invite link' },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <motion.div
        className="card-glow card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}
      >
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '1.75rem', letterSpacing: '-0.02em' }}>
          <Zap size={20} color="var(--color-brand-400)" style={{ display: 'inline', marginRight: 8 }} />
          Create Room
        </h1>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Mode */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Game Mode</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {modeOptions.map(m => (
              <button
                key={m.id}
                id={`mode-${m.id}`}
                onClick={() => setMode(m.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: mode === m.id ? 'var(--color-brand-500)' : 'var(--border-color)',
                  background: mode === m.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <m.icon size={18} color={mode === m.id ? 'var(--color-brand-400)' : 'var(--text-muted)'} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: mode === m.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{m.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Difficulty
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[1,2,3,4,5].map(d => (
              <button
                key={d}
                id={`create-difficulty-${d}`}
                onClick={() => setDifficulty(d)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: difficulty === d ? 'var(--color-brand-500)' : 'var(--border-color)',
                  background: difficulty === d ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)',
                  color: difficulty === d ? 'var(--color-brand-400)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Max Players */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Max Players: <strong style={{ color: 'var(--text-primary)' }}>{maxPlayers}</strong>
          </label>
          <input
            id="max-players-slider"
            type="range"
            min={2}
            max={8}
            value={maxPlayers}
            onChange={e => setMaxPlayers(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-brand-500)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            <span>2</span><span>8</span>
          </div>
        </div>

        <button
          id="create-room-btn"
          className="btn-primary"
          onClick={handleCreate}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Users size={16} />
          {loading ? 'Creating…' : 'Create Room'}
        </button>
      </motion.div>
    </div>
  );
}

function Trophy({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2"/><rect x="6" y="18" width="12" height="4"/></svg>;
}
