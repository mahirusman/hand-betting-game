import type { GameOverReason, Tile, TileValueState } from '../types/game.types';
import { calcTileValue } from './tile-engine';

export function checkGameOverFromHand(
  hand: Tile[],
  tileValueState: TileValueState = {},
): { isGameOver: boolean; reason: GameOverReason | null } {
  for (const tile of hand) {
    const value = calcTileValue(tile, tileValueState);

    if (value === 0) {
      return { isGameOver: true, reason: 'tile_value_zero' };
    }

    if (value === 10) {
      return { isGameOver: true, reason: 'tile_value_ten' };
    }
  }

  return { isGameOver: false, reason: null };
}

export function checkGameOverFromReshuffle(reshuffleCount: number): boolean {
  return reshuffleCount >= 3;
}
