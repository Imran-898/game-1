import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Trophy, User } from 'lucide-react';
import type { Profile, Rating } from '@/lib/game/types';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="card-glow card" style={{ width: '100%', maxWidth: 420, padding: '2rem', textAlign: 'center' }}>
          <User size={32} color="var(--color-brand-400)" style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sign in to view your profile</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Your rating, level, and stats appear here after you start racing.</p>
          <Link href="/auth/login" className="btn-primary">Sign in</Link>
        </div>
      </main>
    );
  }

  const [{ data: profile }, { data: ratings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('ratings').select('*').eq('user_id', user.id),
  ]);

  const p = profile as Profile | null;
  const ratingRows = (ratings ?? []) as Rating[];

  return (
    <main style={{ minHeight: '100vh', padding: '2rem 1.5rem', maxWidth: 760, margin: '0 auto' }}>
      <Link href="/play" className="btn-ghost" style={{ marginBottom: '1.5rem' }}>Back to play</Link>

      <section className="card-glow card" style={{ padding: '2rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-400)', fontWeight: 900, fontSize: '1.5rem' }}>
            {(p?.display_name || p?.username || user.email || 'P')[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{p?.display_name || p?.username || 'Player'}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Level {p?.level ?? 1} - {p?.xp ?? 0} XP</p>
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
          <Trophy size={16} />
          Ratings
        </div>
        {ratingRows.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No rated games yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {ratingRows.map(rating => (
              <div key={rating.mode} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{rating.mode}</span>
                <span style={{ color: 'var(--color-brand-400)', fontWeight: 900 }}>{rating.rating}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

