import { describe, expect, it } from 'vitest';
import type { Tile } from '../types/game.types';
import {
  calcHandValue,
  calcTileValue,
  createInitialTileValueState,
  dealHand,
  evaluateBet,
  generateFullTileSet,
  shuffleTiles,
  updateDynamicTileValues,
} from '../utils/tile-engine';

const tileKey = (tile: Tile) => tile.id;
const findTile = (valueKey: string) => generateFullTileSet().find((tile) => tile.valueKey === valueKey)!;

describe('tile engine', () => {
  describe('generateFullTileSet', () => {
    it('returns a standard 136-tile Mahjong deck', () => {
      const tiles = generateFullTileSet();
      expect(tiles).toHaveLength(136);
      expect(tiles.filter((tile) => tile.kind === 'number')).toHaveLength(108);
      expect(tiles.filter((tile) => tile.kind === 'dragon')).toHaveLength(12);
      expect(tiles.filter((tile) => tile.kind === 'wind')).toHaveLength(16);
    });

    it('creates four physical copies of each unique Mahjong tile value', () => {
      const counts = generateFullTileSet().reduce<Record<string, number>>((acc, tile) => {
        acc[tile.valueKey] = (acc[tile.valueKey] ?? 0) + 1;
        return acc;
      }, {});

      expect(Object.keys(counts)).toHaveLength(34);
      expect(Object.values(counts).every((count) => count === 4)).toBe(true);
    });
  });

  describe('shuffleTiles', () => {
    it('returns the same number of tiles', () => {
      const tiles = generateFullTileSet();
      expect(shuffleTiles(tiles)).toHaveLength(tiles.length);
    });

    it('contains the same physical tiles', () => {
      const tiles = generateFullTileSet();
      expect(shuffleTiles(tiles).map(tileKey).sort()).toEqual(tiles.map(tileKey).sort());
    });
  });

  describe('dealHand', () => {
    it('returns the requested number of tiles', () => {
      expect(dealHand(generateFullTileSet(), 2).hand).toHaveLength(2);
    });

    it('reduces the pile by the requested count', () => {
      expect(dealHand(generateFullTileSet(), 2).remainingPile).toHaveLength(134);
    });

    it('throws if there are too few tiles', () => {
      expect(() => dealHand([findTile('number:bamboo:1')], 2)).toThrow();
    });
  });

  it('calculates number tile values from their face value', () => {
    expect(calcTileValue(findTile('number:bamboo:1'))).toBe(1);
    expect(calcTileValue(findTile('number:characters:6'))).toBe(6);
    expect(calcTileValue(findTile('number:dots:9'))).toBe(9);
  });

  it('calculates Dragon and Wind values from dynamic state', () => {
    const redDragon = findTile('dragon:red');
    const eastWind = findTile('wind:east');
    expect(calcTileValue(redDragon)).toBe(5);
    expect(calcTileValue(eastWind, { 'wind:east': 7 })).toBe(7);
  });

  it('calculates hand values using number and dynamic non-number values', () => {
    expect(
      calcHandValue([findTile('number:bamboo:4'), findTile('dragon:red')], { 'dragon:red': 6 }),
    ).toBe(10);
  });

  it('scales non-number tile values after winning and losing hands', () => {
    const redDragon = findTile('dragon:red');
    const fourBamboo = findTile('number:bamboo:4');
    const initial = createInitialTileValueState();

    const afterWin = updateDynamicTileValues(initial, [redDragon, fourBamboo], 'correct');
    expect(afterWin['dragon:red']).toBe(6);
    expect(afterWin['number:bamboo:4']).toBeUndefined();

    const afterLoss = updateDynamicTileValues(afterWin, [redDragon], 'incorrect');
    expect(afterLoss['dragon:red']).toBe(5);
  });

  it('does not scale tile values on ties', () => {
    const redDragon = findTile('dragon:red');
    const initial = createInitialTileValueState();
    expect(updateDynamicTileValues(initial, [redDragon], 'tie')).toEqual(initial);
  });

  describe('evaluateBet', () => {
    it.each([
      ['higher', 8, 9, 'correct'],
      ['higher', 8, 7, 'incorrect'],
      ['higher', 8, 8, 'tie'],
      ['lower', 8, 7, 'correct'],
      ['lower', 8, 9, 'incorrect'],
      ['lower', 8, 8, 'tie'],
    ] as const)('evaluates %s from %i to %i as %s', (bet, previous, current, result) => {
      expect(evaluateBet(bet, previous, current)).toBe(result);
    });
  });
});
