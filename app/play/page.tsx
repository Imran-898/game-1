'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Users, Play, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import type { Profile } from '@/lib/game/types';

export default function PlayPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    });
  }, []);

  const modes = [
    {
      id: 'practice',
      href: '/play/practice',
      icon: Play,
      title: 'Practice',
      subtitle: 'No timer, unlimited hints',
      color: 'var(--color-accent-400)',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.3)',
    },
    {
      id: 'daily',
      href: '/play/daily',
      icon: Calendar,
      title: "Today's Daily",
      subtitle: 'One puzzle, one ranked attempt',
      color: 'var(--color-brand-400)',
      bg: 'rgba(99,102,241,0.1)',
      border: 'rgba(99,102,241,0.3)',
      badge: 'NEW',
    },
    {
      id: 'casual',
      href: '/play/lobby',
      icon: Users,
      title: 'Casual Multiplayer',
      subtitle: 'Matchmake against players, no rating change',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.3)',
    },
    {
      id: 'ranked',
      href: '/play/ranked',
      icon: Trophy,
      title: 'Ranked',
      subtitle: 'Compete for ELO – Bronze to Master',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.3)',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            Zip<span style={{ color: 'var(--color-brand-400)' }}>Race</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {profile && (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {profile.display_name || profile.username}
            </span>
          )}
          <Link href="/profile" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Profile
          </Link>
        </div>
      </div>

      {/* Welcome */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            {profile ? `Welcome back, ${profile.display_name || profile.username}!` : 'Pick a mode'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Connect the checkpoints in order. Fill every cell. Beat everyone.
          </p>
        </motion.div>
      )}

      {/* Modes grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {modes.map((mode, i) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link
              href={mode.href}
              style={{
                display: 'block',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                background: mode.bg,
                border: `1px solid ${mode.border}`,
                textDecoration: 'none',
                transition: 'transform 0.15s, box-shadow 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 30px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}
            >
              {mode.badge && (
                <span
                  className="badge badge-brand"
                  style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', fontSize: '0.65rem' }}
                >
                  {mode.badge}
                </span>
              )}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: mode.color,
                }}
              >
                <mode.icon size={20} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {mode.title}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {mode.subtitle}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Create / Join room */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/play/room/create" className="btn-primary" style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}>
          <Zap size={16} />
          Create Room
        </Link>
        <Link href="/play/room/join" className="btn-secondary" style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}>
          <Users size={16} />
          Join with Code
        </Link>
      </div>
    </div>
  );
}
