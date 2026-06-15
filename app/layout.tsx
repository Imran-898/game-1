import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ZipRace – Real-Time Path Puzzle Races',
    template: '%s | ZipRace',
  },
  description:
    'Compete in real-time path-puzzle races. Draw a single continuous path through the grid, hit every checkpoint in order, and fill every cell. Race against friends or the world.',
  keywords: ['puzzle', 'game', 'multiplayer', 'racing', 'path puzzle'],
  openGraph: {
    title: 'ZipRace – Real-Time Path Puzzle Races',
    description: 'Race against friends in real-time path puzzles.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZipRace',
    description: 'Race against friends in real-time path puzzles.',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#6366f1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
