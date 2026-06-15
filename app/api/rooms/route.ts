import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const createRoomSchema = z.object({
  mode: z.enum(['ranked', 'casual', 'private', 'practice']),
  difficulty: z.number().int().min(1).max(5).default(2),
  maxPlayers: z.number().int().min(2).max(8).default(8),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const body = await req.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });

    const { mode, difficulty, maxPlayers } = parsed.data;

    // Generate a unique room code
    const admin = createAdminClient();
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await admin.from('rooms').select('id').eq('code', code).single();
      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }

    const { data: room, error } = await admin.from('rooms').insert({
      code,
      host_id: user.id,
      mode,
      difficulty,
      max_players: maxPlayers,
      status: 'lobby',
    }).select().single();

    if (error) throw error;

    // Add host as first player
    await admin.from('room_players').insert({ room_id: room.id, user_id: user.id });

    return NextResponse.json({ id: room.id, code: room.code });
  } catch (err) {
    console.error('[/api/rooms POST]', err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR' } }, { status: 500 });
  }
}
