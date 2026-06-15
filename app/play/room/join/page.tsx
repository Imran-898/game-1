'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DoorOpen, Hash, Users } from 'lucide-react';

export default function JoinRoomPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roomCode = code.trim().toUpperCase();
    if (roomCode.length !== 6) {
      setError('Enter a 6-character room code.');
      return;
    }

    setLoading(true);
    setError(null);
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: roomCode }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? 'Could not join that room. Check the code or sign in first.');
      setLoading(false);
      return;
    }

    const room = await res.json();
    router.push(`/play/room/${room.code}`);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <motion.div
        className="card-glow card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <DoorOpen size={22} color="var(--color-brand-400)" />
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>Join Room</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Enter the code your friend shared.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Room code
            </span>
            <div style={{ position: 'relative' }}>
              <Hash size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="room-code"
                className="input"
                value={code}
                onChange={e => setCode(e.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                minLength={6}
                maxLength={6}
                required
                style={{ paddingLeft: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}
              />
            </div>
          </label>

          <button id="join-room-btn" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            <Users size={16} />
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>

        <Link href="/play/room/create" className="btn-ghost" style={{ width: '100%', marginTop: '1rem' }}>
          Create a room instead
        </Link>
      </motion.div>
    </div>
  );
}

