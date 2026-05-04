import { GAME_OVER_HIGH, GAME_OVER_LOW, MAX_RESHUFFLES } from '../config/game.config';
import type { GameOverReason, Tile, TileValueState } from '../types/game.types';
import { calcTileValue } from './tile-engine';

export interface GameOverCheck {
  isGameOver: boolean;
  reason: GameOverReason | null;
}

const NOT_OVER: GameOverCheck = { isGameOver: false, reason: null };

function classifyValue(value: number): GameOverCheck {
  if (value <= GAME_OVER_LOW) return { isGameOver: true, reason: 'tile_value_zero' };
  if (value >= GAME_OVER_HIGH) return { isGameOver: true, reason: 'tile_value_ten' };
  return NOT_OVER;
}

/**
 * Game over when any tile in the just-revealed hand has a terminal value
 * (0 or 10) under the current tileValueState.
 */
export function checkGameOverFromHand(
  hand: Tile[],
  tileValueState: TileValueState = {},
): GameOverCheck {
  for (const tile of hand) {
    const verdict = classifyValue(calcTileValue(tile, tileValueState));
    if (verdict.isGameOver) return verdict;
  }
  return NOT_OVER;
}

/**
 * Game over when *any* non-number tile in the current value state has reached
 * a terminal value, even if it is not part of the just-revealed hand. Without
 * this check, a tile driven to 0 or 10 by past scaling could lurk in the deck
 * and never end the game.
 */
export function checkGameOverFromTileValueState(
  tileValueState: TileValueState = {},
): GameOverCheck {
  for (const value of Object.values(tileValueState)) {
    const verdict = classifyValue(value);
    if (verdict.isGameOver) return verdict;
  }
  return NOT_OVER;
}

/**
 * The draw pile has been exhausted enough times to end the game.
 * The spec says "the 3rd time" — encoded as `>= MAX_RESHUFFLES`.
 */
export function checkGameOverFromReshuffle(reshuffleCount: number): boolean {
  return reshuffleCount >= MAX_RESHUFFLES;
}

/**
 * Convenience: combine the hand-level and global tile-value checks. The hand
 * check wins on tie because its message is more specific to what the player
 * just saw.
 */
export function checkTileValueGameOver(
  hand: Tile[],
  tileValueState: TileValueState = {},
): GameOverCheck {
  const fromHand = checkGameOverFromHand(hand, tileValueState);
  if (fromHand.isGameOver) return fromHand;
  return checkGameOverFromTileValueState(tileValueState);
}
