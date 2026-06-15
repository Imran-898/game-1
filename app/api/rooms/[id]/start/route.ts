import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generatePuzzle } from '@/lib/game/generate';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const admin = createAdminClient();
    const { data: room } = await admin.from('rooms').select('*').eq('id', id).single();

    if (!room) return NextResponse.json({ error: { code: 'ROOM_NOT_FOUND' } }, { status: 404 });
    if (room.host_id !== user.id) return NextResponse.json({ error: { code: 'NOT_HOST' } }, { status: 403 });
    if (room.status !== 'lobby') return NextResponse.json({ error: { code: 'ROOM_NOT_IN_LOBBY' } }, { status: 400 });

    // Generate a puzzle and insert it
    const puzzleData = generatePuzzle({ difficulty: room.difficulty });
    if (!puzzleData) return NextResponse.json({ error: { code: 'PUZZLE_GENERATION_FAILED' } }, { status: 500 });

    const { data: puzzle } = await admin.from('puzzles').insert({
      grid_size: puzzleData.grid_size,
      checkpoints: puzzleData.checkpoints,
      walls: puzzleData.walls,
      difficulty: puzzleData.difficulty,
      solution: null,
    }).select().single();

    if (!puzzle) return NextResponse.json({ error: { code: 'PUZZLE_INSERT_FAILED' } }, { status: 500 });

    // Transition: lobby → countdown → in_round
    await admin.from('rooms').update({
      status: 'countdown',
      puzzle_id: puzzle.id,
    }).eq('id', id);

    // After 3 seconds, transition to in_round
    setTimeout(async () => {
      await admin.from('rooms').update({
        status: 'in_round',
        round_started_at: new Date().toISOString(),
      }).eq('id', id);
    }, 3000);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/rooms/[id]/start]', err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR' } }, { status: 500 });
  }
}
