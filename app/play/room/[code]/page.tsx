'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/browser';
import Grid from '@/components/Grid';
import { validatePath } from '@/lib/game/validate';
import type { Puzzle, Path, Room, RoomPlayer, Profile } from '@/lib/game/types';
import { Users, Copy, Play, Crown } from 'lucide-react';

const PROGRESS_THROTTLE_MS = 500; // max 2 updates/s per player

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<RoomPlayer[] | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProgressUpdate = useRef<number>(0);
  const startTime = useRef<number | null>(null);

  // Load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user?.id ?? null);
    });
  }, []);

  // Load room by code
  useEffect(() => {
    if (!code) return;
    supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()
      .then(({ data }) => {
        if (data) setRoom(data);
        else router.push('/play');
      });
  }, [code]);

  // Load players when room is set
  useEffect(() => {
    if (!room) return;
    loadPlayers();
  }, [room?.id]);

  async function loadPlayers() {
    if (!room) return;
    const { data } = await supabase.from('room_players').select('*').eq('room_id', room.id);
    if (data) {
      setPlayers(data);
      // Load profiles
      const ids = data.map(p => p.user_id);
      const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
      if (profs) {
        const map = new Map(profs.map(p => [p.id, p]));
        setProfiles(map);
      }
    }
  }

  // Load puzzle when room has puzzle_id
  useEffect(() => {
    if (!room?.puzzle_id) return;
    supabase
      .from('puzzles_public')
      .select('*')
      .eq('id', room.puzzle_id)
      .single()
      .then(({ data }) => {
        if (data) setPuzzle(data);
      });
  }, [room?.puzzle_id]);

  // Subscribe to Realtime changes
  useEffect(() => {
    if (!room) return;

    const roomChannel = supabase
      .channel(`room-${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${room.id}`,
      }, payload => {
        setRoom(payload.new as Room);
        if (payload.new.status === 'in_round' && !startTime.current) {
          startTime.current = Date.now();
          timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime.current!) / 1000));
          }, 1000);
        }
        if (payload.new.status === 'results') {
          if (timerRef.current) clearInterval(timerRef.current);
          loadResults(room.id);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_players',
        filter: `room_id=eq.${room.id}`,
      }, () => {
        loadPlayers();
      })
      .on('broadcast', { event: 'progress' }, payload => {
        setPlayers(prev =>
          prev.map(p => p.user_id === payload.payload.userId
            ? { ...p, progress: payload.payload.progress }
            : p
          )
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(roomChannel); };
  }, [room?.id]);

  async function loadResults(roomId: string) {
    const { data } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .order('placement', { ascending: true });
    setResults(data ?? []);
  }

  // Countdown when room transitions to countdown
  useEffect(() => {
    if (room?.status !== 'countdown') return;
    const frame = requestAnimationFrame(() => setCountdown(3));
    const id = setInterval(() => {
      setCountdown(v => {
        if (v === null || v <= 1) { clearInterval(id); return null; }
        return v - 1;
      });
    }, 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, [room?.status]);

  function handlePathChange(path: Path) {
    if (!room || !currentUser) return;
    const progress = Math.round((path.length / ((puzzle?.grid_size ?? 5) ** 2)) * 100);

    const now = Date.now();
    if (now - lastProgressUpdate.current < PROGRESS_THROTTLE_MS) return;
    lastProgressUpdate.current = now;

    // Broadcast coarse progress (NOT the path)
    supabase.channel(`room-${room.id}`).send({
      type: 'broadcast',
      event: 'progress',
      payload: { userId: currentUser, progress },
    });
  }

  async function handleSolve(path: Path) {
    if (!puzzle || !room || !currentUser || finished) return;
    const result = validatePath(path, puzzle);
    if (!result.valid) return;

    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const solveMs = startTime.current ? Date.now() - startTime.current : 0;

    const res = await fetch('/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: room.id,
        roundToken: room.id, // simplified token
        path,
        solveMs,
      }),
    });

    if (!res.ok) console.error('Solve submission failed');
  }

  async function startRoom() {
    await fetch(`/api/rooms/${room?.id}/start`, { method: 'POST' });
  }

  function copyInvite() {
    navigator.clipboard.writeText(`${location.origin}/play/room/${code}`).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  const isHost = currentUser === room?.host_id;
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Results screen ──────────────────────────────────────────
  if (results) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div className="card-glow card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            🏁 Results
          </h2>
          {results.map((p, i) => {
            const prof = profiles.get(p.user_id);
            return (
              <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem', borderRadius: 'var(--radius-md)', background: i === 0 ? 'rgba(99,102,241,0.1)' : 'transparent', marginBottom: '0.5rem', border: i === 0 ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent' }}>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: i === 0 ? 'var(--color-brand-400)' : 'var(--text-muted)', width: 24, textAlign: 'center' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <span style={{ flex: 1, fontWeight: 600 }}>{prof?.display_name || prof?.username || 'Player'}</span>
                <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                  {p.solve_ms ? `${(p.solve_ms / 1000).toFixed(2)}s` : 'DNF'}
                </span>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'center' }}>
            {isHost && (
              <button className="btn-primary" onClick={startRoom}>
                Play Again
              </button>
            )}
            <a href="/play" className="btn-secondary">Leave</a>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── In-round view ───────────────────────────────────────────
  if (room?.status === 'in_round' && puzzle) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1rem', gap: '1rem' }}>
        {/* Timer + Opponents */}
        <div style={{ width: '100%', maxWidth: '700px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
            {formatTime(elapsed)}
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {players.filter(p => p.user_id !== currentUser).map(p => {
              const prof = profiles.get(p.user_id);
              return (
                <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {prof?.display_name || prof?.username || 'Player'}
                  </span>
                  <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                    <motion.div
                      style={{ height: '100%', borderRadius: 3, background: p.finished_at ? 'var(--color-accent-500)' : 'var(--color-brand-500)' }}
                      animate={{ width: `${p.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {p.finished_at ? '✓' : `${p.progress}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <Grid puzzle={puzzle} onPathChange={handlePathChange} onSolve={handleSolve} disabled={finished} />

        {finished && !results && (
          <motion.div className="card" style={{ padding: '1rem 2rem', textAlign: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>✅ Solved! Waiting for others…</div>
          </motion.div>
        )}
      </div>
    );
  }

  // ── Countdown ───────────────────────────────────────────────
  if (room?.status === 'countdown' && countdown !== null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Get ready…</p>
        <motion.div
          key={countdown}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--color-brand-400)', lineHeight: 1 }}
        >
          {countdown}
        </motion.div>
      </div>
    );
  }

  // ── Lobby ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem', gap: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
              Room <span style={{ color: 'var(--color-brand-400)' }}>{code?.toUpperCase()}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {players.length} / {room?.max_players ?? 8} players · {room?.mode}
            </p>
          </div>
          <button
            id="copy-invite"
            className="btn-secondary"
            onClick={copyInvite}
            style={{ fontSize: '0.85rem', gap: '0.4rem' }}
          >
            <Copy size={14} />
            {copySuccess ? 'Copied!' : 'Copy invite'}
          </button>
        </div>

        {/* Player list */}
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Users size={14} />
            Players
          </div>
          {players.map(p => {
            const prof = profiles.get(p.user_id);
            return (
              <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand-400)' }}>
                  {(prof?.display_name || prof?.username || 'P')[0].toUpperCase()}
                </div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.925rem' }}>
                  {prof?.display_name || prof?.username || 'Guest'}
                </span>
                {p.user_id === room?.host_id && (
                  <Crown size={14} color="var(--color-brand-400)" />
                )}
              </div>
            );
          })}
          {players.length < (room?.max_players ?? 8) && (
            <div style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Waiting for more players…
            </div>
          )}
        </div>

        {/* Start button (host only) */}
        {isHost && (
          <button
            id="start-room-btn"
            className="btn-primary"
            onClick={startRoom}
            disabled={players.length < 1}
            style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Play size={18} /> Start Game
          </button>
        )}
        {!isHost && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Waiting for the host to start…
          </p>
        )}
      </div>
    </div>
  );
}
