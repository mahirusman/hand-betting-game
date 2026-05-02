import { describe, expect, it } from 'vitest';
import type { Tile } from '../types/game.types';
import { generateFullTileSet } from '../utils/tile-engine';
import { checkGameOverFromHand, checkGameOverFromReshuffle } from '../utils/game-rules';

const findTile = (valueKey: string): Tile =>
  generateFullTileSet().find((tile) => tile.valueKey === valueKey)!;

describe('game rules', () => {
  describe('checkGameOverFromHand', () => {
    it('detects a dynamic non-number tile value reaching 0', () => {
      expect(checkGameOverFromHand([findTile('dragon:red')], { 'dragon:red': 0 })).toEqual({
        isGameOver: true,
        reason: 'tile_value_zero',
      });
    });

    it('detects a dynamic non-number tile value reaching 10', () => {
      expect(checkGameOverFromHand([findTile('wind:east')], { 'wind:east': 10 })).toEqual({
        isGameOver: true,
        reason: 'tile_value_ten',
      });
    });

    it('allows hands without terminal tile values', () => {
      expect(
        checkGameOverFromHand([findTile('number:bamboo:9'), findTile('dragon:green')], {
          'dragon:green': 5,
        }),
      ).toEqual({
        isGameOver: false,
        reason: null,
      });
    });
  });

  describe('checkGameOverFromReshuffle', () => {
    it('returns false below 3', () => {
      expect(checkGameOverFromReshuffle(2)).toBe(false);
    });

    it('returns true at 3', () => {
      expect(checkGameOverFromReshuffle(3)).toBe(true);
    });

    it('returns true above 3', () => {
      expect(checkGameOverFromReshuffle(4)).toBe(true);
    });
  });
});
