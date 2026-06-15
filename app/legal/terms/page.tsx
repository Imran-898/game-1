import Link from 'next/link';

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '3rem 1.5rem', maxWidth: 760, margin: '0 auto', lineHeight: 1.7 }}>
      <Link href="/" className="btn-ghost" style={{ marginBottom: '1.5rem' }}>Back home</Link>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Terms</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Play fairly, do not abuse multiplayer rooms or automation, and use ZipRace as-is while the project is under active development.
      </p>
    </main>
  );
}
