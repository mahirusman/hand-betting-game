import { describe, expect, it } from 'vitest';
import type { Tile } from '../types/game.types';
import { generateFullTileSet } from '../utils/tile-engine';
import {
  checkGameOverFromHand,
  checkGameOverFromReshuffle,
  checkGameOverFromTileValueState,
  checkTileValueGameOver,
} from '../utils/game-rules';

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

  describe('checkGameOverFromTileValueState', () => {
    it('returns false when no value is terminal', () => {
      expect(checkGameOverFromTileValueState({ 'dragon:red': 4, 'wind:east': 6 })).toEqual({
        isGameOver: false,
        reason: null,
      });
    });

    it('catches a tile value of 0 even when that tile is not in the current hand', () => {
      expect(checkGameOverFromTileValueState({ 'dragon:white': 0, 'wind:north': 5 })).toEqual({
        isGameOver: true,
        reason: 'tile_value_zero',
      });
    });

    it('catches a tile value of 10 even when that tile is not in the current hand', () => {
      expect(checkGameOverFromTileValueState({ 'dragon:white': 5, 'wind:north': 10 })).toEqual({
        isGameOver: true,
        reason: 'tile_value_ten',
      });
    });
  });

  describe('checkTileValueGameOver', () => {
    it('reports the hand-level reason when a current-hand tile is terminal', () => {
      const result = checkTileValueGameOver([findTile('dragon:red')], {
        'dragon:red': 0,
        'wind:east': 10,
      });
      expect(result).toEqual({ isGameOver: true, reason: 'tile_value_zero' });
    });

    it('falls back to the global state scan when the hand is fine', () => {
      const result = checkTileValueGameOver([findTile('number:bamboo:5')], {
        'dragon:red': 10,
      });
      expect(result).toEqual({ isGameOver: true, reason: 'tile_value_ten' });
    });

    it('returns no game-over when neither check trips', () => {
      const result = checkTileValueGameOver([findTile('number:bamboo:5')], {
        'dragon:red': 5,
      });
      expect(result).toEqual({ isGameOver: false, reason: null });
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
