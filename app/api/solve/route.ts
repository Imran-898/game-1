import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { validatePath } from '@/lib/game/validate';
import { computeMultiplayerRatings } from '@/lib/game/elo';
import type { Puzzle, RoomMode } from '@/lib/game/types';

export const dynamic = 'force-dynamic';

const solveSchema = z.object({
  roomId: z.string().uuid(),
  roundToken: z.string().min(1),
  path: z.array(z.object({ r: z.number().int(), c: z.number().int() })),
  solveMs: z.number().int().positive(),
});

type FinishedPlayer = {
  user_id: string;
  placement: number | null;
  solve_ms: number | null;
};

type SolvedRoom = {
  id: string;
  puzzle_id: string;
  mode: RoomMode;
  status: string;
  puzzles?: Puzzle | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const body = await req.json();
    const parsed = solveSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });

    const { roomId, path, solveMs } = parsed.data;

    // Plausibility: minimum 2s solve time
    if (solveMs < 2000) {
      return NextResponse.json({ error: { code: 'IMPLAUSIBLE_SOLVE' } }, { status: 400 });
    }

    const admin = createAdminClient();

    // Load room and puzzle
    const { data } = await admin.from('rooms').select('*, puzzles(*)').eq('id', roomId).single();
    const room = data as SolvedRoom | null;
    if (!room || room.status !== 'in_round') {
      return NextResponse.json({ error: { code: 'ROOM_NOT_ACTIVE' } }, { status: 400 });
    }

    // Check not already finished
    const { data: playerRow } = await admin.from('room_players').select('*').eq('room_id', roomId).eq('user_id', user.id).single();
    if (!playerRow || playerRow.finished_at) {
      return NextResponse.json({ error: { code: 'ALREADY_FINISHED' } }, { status: 400 });
    }

    // Server-side path validation using the puzzle from DB
    const puzzle = room.puzzles as unknown as Puzzle;
    if (puzzle) {
      const result = validatePath(path, puzzle);
      if (!result.valid) {
        return NextResponse.json({ error: { code: 'INVALID_PATH', message: result.reason } }, { status: 400 });
      }
    }

    // Compute placement (count finished players before us + 1)
    const { count } = await admin.from('room_players').select('*', { count: 'exact', head: true }).eq('room_id', roomId).not('finished_at', 'is', null);
    const placement = (count ?? 0) + 1;

    const finishedAt = new Date().toISOString();

    // Mark player as finished
    await admin.from('room_players').update({
      progress: 100,
      finished_at: finishedAt,
      solve_ms: solveMs,
      placement,
    }).eq('room_id', roomId).eq('user_id', user.id);

    // Check if all players are finished
    const { count: totalCount } = await admin.from('room_players').select('*', { count: 'exact', head: true }).eq('room_id', roomId);
    const { count: finishedCount } = await admin.from('room_players').select('*', { count: 'exact', head: true }).eq('room_id', roomId).not('finished_at', 'is', null);

    if (totalCount === finishedCount) {
      // Round over – finalize match results
      await finalizeMatch(admin, room, roomId);
    }

    // Broadcast progress update via Realtime (the client will pick this up via DB change)
    return NextResponse.json({ success: true, placement });
  } catch (err) {
    console.error('[/api/solve]', err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR' } }, { status: 500 });
  }
}

async function finalizeMatch(admin: ReturnType<typeof createAdminClient>, room: SolvedRoom, roomId: string) {
  // Get all players in order of placement
  const { data: players } = await admin
    .from('room_players')
    .select('user_id, placement, solve_ms')
    .eq('room_id', roomId)
    .order('placement', { ascending: true });

  if (!players) return;
  const finishedPlayers = players as FinishedPlayer[];

  // Create match record
  const { data: match } = await admin.from('matches').insert({
    room_id: roomId,
    puzzle_id: room.puzzle_id,
    mode: room.mode,
  }).select().single();

  if (!match) return;

  // Update ratings if ranked mode
  if (room.mode === 'ranked') {
    const ratingRows = await Promise.all(
      finishedPlayers.map(p =>
        admin.from('ratings').select('rating').eq('user_id', p.user_id).eq('mode', 'ranked').single().then(({ data }) => ({
          userId: p.user_id,
          rating: data?.rating ?? 1000,
          placement: p.placement ?? 99,
        }))
      )
    );

    const newRatings = computeMultiplayerRatings(ratingRows);

    await Promise.all(
      finishedPlayers.map(async p => {
        const before = ratingRows.find(r => r.userId === p.user_id)?.rating ?? 1000;
        const after = newRatings.get(p.user_id) ?? before;

        await admin.from('match_results').insert({
          match_id: match.id,
          user_id: p.user_id,
          placement: p.placement,
          solve_ms: p.solve_ms,
          rating_before: before,
          rating_after: after,
        });

        await admin.from('ratings').upsert({
          user_id: p.user_id,
          mode: 'ranked',
          rating: after,
          games_played: admin.rpc('increment', { x: 1 }),
          updated_at: new Date().toISOString(),
        });
      })
    );
  } else {
    await Promise.all(
      finishedPlayers.map(p =>
        admin.from('match_results').insert({
          match_id: match.id,
          user_id: p.user_id,
          placement: p.placement,
          solve_ms: p.solve_ms,
        })
      )
    );
  }

  // Close room
  await admin.from('rooms').update({ status: 'results' }).eq('id', roomId);
}
