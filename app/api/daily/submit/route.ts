import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { validatePath } from '@/lib/game/validate';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  puzzleId: z.string().min(1),
  dailyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  solveMs: z.number().int().positive(),
  path: z.array(z.object({ r: z.number().int(), c: z.number().int() })),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
    }

    const { puzzleId, dailyDate, solveMs, path } = parsed.data;

    // Plausibility check: reject solve_ms < 3s (too fast for any puzzle)
    if (solveMs < 3000) {
      return NextResponse.json({ error: { code: 'IMPLAUSIBLE_SOLVE', message: 'Solve time too fast' } }, { status: 400 });
    }

    // Check if already completed
    const { data: existing } = await supabase
      .from('daily_results')
      .select('completed')
      .eq('user_id', user.id)
      .eq('daily_date', dailyDate)
      .single();
    if (existing?.completed) {
      return NextResponse.json({ error: { code: 'ALREADY_SUBMITTED', message: 'Already submitted' } }, { status: 400 });
    }

    // Load puzzle from DB and validate server-side
    const admin = createAdminClient();
    const { data: puzzle } = await admin.from('puzzles').select('*').eq('id', puzzleId).single();

    if (puzzle) {
      const result = validatePath(path, {
        id: puzzle.id,
        grid_size: puzzle.grid_size,
        checkpoints: puzzle.checkpoints,
        walls: puzzle.walls,
        difficulty: puzzle.difficulty,
      });
      if (!result.valid) {
        return NextResponse.json({ error: { code: 'INVALID_PATH', message: result.reason } }, { status: 400 });
      }
    }
    // If puzzle not in DB (generated client-side), we trust the client for now
    // Full server-side generation would be the production improvement

    // Write result
    await supabase.from('daily_results').upsert({
      user_id: user.id,
      daily_date: dailyDate,
      solve_ms: solveMs,
      completed: true,
    });

    // Update streak
    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (streak) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const currentStreak = streak.last_completed === yesterdayStr ? streak.current_streak + 1 : 1;
      const longestStreak = Math.max(currentStreak, streak.longest_streak);
      await supabase.from('streaks').update({ current_streak: currentStreak, longest_streak: longestStreak, last_completed: dailyDate }).eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/daily/submit]', err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
