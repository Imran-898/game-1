import { createClient } from '@/lib/supabase/server';
import DailyClient from './daily-client';
import { generateDailyPuzzle } from '@/lib/game/generate';

export const metadata = { title: "Today's Daily Puzzle" };

export default async function DailyPage() {
  const today = new Date().toISOString().slice(0, 10);

  // Try to load from DB first
  const supabase = await createClient();
  const { data: dbPuzzle } = await supabase
    .from('puzzles_public')
    .select('*')
    .eq('is_daily', true)
    .eq('daily_date', today)
    .single();

  // Fall back to deterministic generation if not in DB
  const puzzle = dbPuzzle ?? generateDailyPuzzle(today, 3);

  // Load this user's prior result for today
  const { data: { user } } = await supabase.auth.getUser();
  let priorResult = null;
  if (user) {
    const { data } = await supabase
      .from('daily_results')
      .select('*')
      .eq('user_id', user.id)
      .eq('daily_date', today)
      .single();
    priorResult = data;
  }

  return <DailyClient puzzle={puzzle} today={today} priorResult={priorResult} userId={user?.id} />;
}
