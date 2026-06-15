import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '3rem 1.5rem', maxWidth: 760, margin: '0 auto', lineHeight: 1.7 }}>
      <Link href="/" className="btn-ghost" style={{ marginBottom: '1.5rem' }}>Back home</Link>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Privacy</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        ZipRace stores account, room, puzzle, and result data needed to run the game. Authentication is handled through Supabase. Do not put sensitive personal information in usernames or room names.
      </p>
    </main>
  );
}

