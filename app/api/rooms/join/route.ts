import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const joinSchema = z.object({ code: z.string().length(6) });

type RoomWithPlayerCount = {
  id: string;
  code: string;
  status: string;
  max_players: number;
  room_players?: Array<{ count: number }>;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const body = await req.json();
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR' } }, { status: 400 });

    const admin = createAdminClient();
    const { data } = await admin.from('rooms').select('*, room_players(count)').eq('code', parsed.data.code.toUpperCase()).single();
    const room = data as RoomWithPlayerCount | null;

    if (!room) return NextResponse.json({ error: { code: 'ROOM_NOT_FOUND' } }, { status: 404 });
    if (room.status !== 'lobby') return NextResponse.json({ error: { code: 'ROOM_NOT_JOINABLE' } }, { status: 400 });

    // Check if already in room
    const { data: existing } = await admin.from('room_players').select('user_id').eq('room_id', room.id).eq('user_id', user.id).single();
    if (!existing) {
      const playerCount = room.room_players?.[0]?.count ?? 0;
      if (playerCount >= room.max_players) {
        return NextResponse.json({ error: { code: 'ROOM_FULL' } }, { status: 400 });
      }
      await admin.from('room_players').insert({ room_id: room.id, user_id: user.id });
    }

    return NextResponse.json({ id: room.id, code: room.code });
  } catch (err) {
    console.error('[/api/rooms/join]', err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR' } }, { status: 500 });
  }
}
