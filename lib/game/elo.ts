// ============================================================
// ZipRace – ELO / MMR System
// ============================================================

const K_FACTOR = 32;
const DEFAULT_RATING = 1000;

/**
 * Expected score for player A against player B
 */
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Compute new rating after a head-to-head result.
 * scoreA: 1 for win, 0.5 for draw, 0 for loss.
 */
export function computeNewRating(
  ratingA: number,
  ratingB: number,
  scoreA: number
): number {
  const ea = expectedScore(ratingA, ratingB);
  return Math.round(ratingA + K_FACTOR * (scoreA - ea));
}

export interface PlayerResult {
  userId: string;
  rating: number;
  placement: number; // 1 = first
}

/**
 * Compute rating changes for a multiplayer match.
 * Each player is compared against every other player (round-robin).
 * Returns a map of userId → new rating.
 */
export function computeMultiplayerRatings(
  players: PlayerResult[]
): Map<string, number> {
  const newRatings = new Map<string, number>();

  for (const player of players) {
    newRatings.set(player.userId, player.rating);
  }

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];

      // Lower placement = better result
      let scoreA: number;
      if (a.placement < b.placement) {
        scoreA = 1;
      } else if (a.placement === b.placement) {
        scoreA = 0.5;
      } else {
        scoreA = 0;
      }

      const rA = newRatings.get(a.userId)!;
      const rB = newRatings.get(b.userId)!;

      newRatings.set(a.userId, computeNewRating(rA, rB, scoreA));
      newRatings.set(b.userId, computeNewRating(rB, rA, 1 - scoreA));
    }
  }

  return newRatings;
}

export { DEFAULT_RATING };
