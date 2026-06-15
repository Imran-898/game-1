'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Trophy, Users, Clock } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Real-Time Racing',
    desc: 'Race up to 8 players on the exact same puzzle simultaneously.',
  },
  {
    icon: Trophy,
    title: 'Ranked Ladder',
    desc: 'Earn ELO rating, climb tiers from Bronze to Master.',
  },
  {
    icon: Users,
    title: 'Private Rooms',
    desc: 'Create a room, share the code, race your friends instantly.',
  },
  {
    icon: Clock,
    title: 'Daily Puzzle',
    desc: 'One puzzle per day. Compete for the fastest solve on the global board.',
  },
];

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav
        className="glass"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
          Zip<span style={{ color: 'var(--color-brand-400)' }}>Race</span>
        </span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/auth/login" className="btn-ghost" style={{ fontSize: '0.875rem' }}>
            Sign in
          </Link>
          <Link href="/auth/signup" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
            Play free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          paddingTop: '12rem',
          paddingBottom: '6rem',
          textAlign: 'center',
          padding: '10rem 1.5rem 6rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="badge badge-brand" style={{ marginBottom: '1.5rem', margin: '0 auto 1.5rem' }}>
            🎮 Real-Time Multiplayer Puzzle Racing
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: '1.5rem',
            }}
          >
            Race to Solve.<br />
            <span
              style={{
                background: 'linear-gradient(135deg, var(--color-brand-400), var(--color-accent-400))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Beat Everyone.
            </span>
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              maxWidth: '560px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.7,
            }}
          >
            Draw a single continuous path that visits every checkpoint in order
            and fills every cell. Simple to learn, incredibly competitive.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/play" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
              <Zap size={18} />
              Start Playing
            </Link>
            <Link href="/play/daily" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
              <Clock size={18} />
              Today&apos;s Daily
            </Link>
          </div>
        </motion.div>

        {/* Mini preview grid */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{ marginTop: '4rem' }}
        >
          <MiniGridDemo />
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '3rem',
          }}
        >
          Everything you need to{' '}
          <span style={{ color: 'var(--color-brand-400)' }}>compete</span>
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              style={{ padding: '1.75rem' }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99,102,241,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: 'var(--color-brand-400)',
                }}
              >
                <f.icon size={22} />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.0625rem' }}>
                {f.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div className="card-glow card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '1rem' }}>
            Ready to race?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Join thousands of players competing daily. No install needed.
          </p>
          <Link href="/auth/signup" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.5rem' }}>
            Create free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
        }}
      >
        © 2026 ZipRace · Original game in the path-puzzle genre ·{' '}
        <Link href="/legal/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>
          Privacy
        </Link>{' '}
        ·{' '}
        <Link href="/legal/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>
          Terms
        </Link>
      </footer>
    </main>
  );
}

/** Animated decorative grid showing a solved path */
function MiniGridDemo() {
  const GRID = 5;
  // Pre-solved snake path
  const path = [
    [0,0],[0,1],[0,2],[0,3],[0,4],
    [1,4],[1,3],[1,2],[1,1],[1,0],
    [2,0],[2,1],[2,2],[2,3],[2,4],
    [3,4],[3,3],[3,2],[3,1],[3,0],
    [4,0],[4,1],[4,2],[4,3],[4,4],
  ];
  const checkpoints = new Map([[`0,0`, 1], [`2,2`, 2], [`4,4`, 3]]);

  return (
    <div
      className="card-glow card"
      style={{
        display: 'inline-block',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID}, 52px)`,
          gridTemplateRows: `repeat(${GRID}, 52px)`,
          gap: '3px',
        }}
      >
        {Array.from({ length: GRID * GRID }, (_, idx) => {
          const r = Math.floor(idx / GRID);
          const c = idx % GRID;
          const pathIdx = path.findIndex(([pr, pc]) => pr === r && pc === c);
          const isOnPath = pathIdx !== -1;
          const cp = checkpoints.get(`${r},${c}`);
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + pathIdx * 0.04, duration: 0.2 }}
              style={{
                borderRadius: 'var(--radius-sm)',
                background: isOnPath
                  ? cp
                    ? 'var(--color-brand-500)'
                    : 'rgba(99,102,241,0.35)'
                  : 'var(--bg-secondary)',
                border: '1px solid',
                borderColor: isOnPath
                  ? 'rgba(99,102,241,0.6)'
                  : 'var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 800,
                color: cp ? 'white' : 'transparent',
                boxShadow: cp ? '0 0 12px rgba(99,102,241,0.6)' : 'none',
              }}
            >
              {cp ?? ''}
            </motion.div>
          );
        })}
      </div>
      <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Connect 1 → 2 → 3, fill every cell
      </p>
    </div>
  );
}
