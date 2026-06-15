// ============================================================
// ZipRace – Shared Game Types
// Pure types, no side-effects. Used on both client & server.
// ============================================================

export interface Cell {
  r: number;
  c: number;
}

export interface Checkpoint {
  n: number; // 1-indexed order (1 = first, N = last)
  r: number;
  c: number;
}

/** Which edge of cell (r,c) the wall sits on */
export type WallSide = 'top' | 'right' | 'bottom' | 'left';

export interface Wall {
  r: number;
  c: number;
  side: WallSide;
}

export interface Puzzle {
  id: string;
  grid_size: number;
  checkpoints: Checkpoint[];
  walls: Wall[];
  difficulty: number; // 1–5
  is_daily?: boolean;
  daily_date?: string; // ISO date
  created_at?: string;
}

/** Path is an ordered list of cells the player has drawn */
export type Path = Cell[];

export type RoomStatus = 'lobby' | 'countdown' | 'in_round' | 'results' | 'closed';
export type RoomMode = 'ranked' | 'casual' | 'private' | 'practice';

export interface RoomPlayer {
  room_id: string;
  user_id: string;
  joined_at: string;
  progress: number; // 0–100 coarse %
  finished_at?: string | null;
  solve_ms?: number | null;
  placement?: number | null;
}

export interface Room {
  id: string;
  code: string;
  host_id: string;
  mode: RoomMode;
  status: RoomStatus;
  puzzle_id?: string | null;
  max_players: number;
  difficulty: number;
  round_started_at?: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  country?: string | null;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  user_id: string;
  mode: RoomMode;
  rating: number;
  games_played: number;
  updated_at: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}
