import type {
  BetDirection,
  BetResult,
  DragonTile,
  MahjongTile,
  Tile,
  TileSuit,
  TileValueState,
  WindTile,
} from '../types/game.types';

export const MAHJONG_COPY_COUNT = 4;
export const NON_NUMBER_BASE_VALUE = 5;

const SUITS: TileSuit[] = ['bamboo', 'characters', 'dots'];
const DRAGONS: DragonTile[] = ['red', 'green', 'white'];
const WINDS: WindTile[] = ['east', 'south', 'west', 'north'];

function title(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function withCopies(base: Omit<MahjongTile, 'id'>): MahjongTile[] {
  return Array.from({ length: MAHJONG_COPY_COUNT }, (_, copyIndex) => ({
    ...base,
    id: `${base.valueKey}#${copyIndex + 1}`,
  }));
}

export function generateMahjongTileSet(): Tile[] {
  const tiles: Tile[] = [];

  for (const suit of SUITS) {
    for (let faceValue = 1; faceValue <= 9; faceValue += 1) {
      tiles.push(
        ...withCopies({
          valueKey: `number:${suit}:${faceValue}`,
          kind: 'number',
          suit,
          faceValue,
          label: `${faceValue} ${title(suit)}`,
        }),
      );
    }
  }

  for (const dragon of DRAGONS) {
    tiles.push(
      ...withCopies({
        valueKey: `dragon:${dragon}`,
        kind: 'dragon',
        dragon,
        label: `${title(dragon)} Dragon`,
      }),
    );
  }

  for (const wind of WINDS) {
    tiles.push(
      ...withCopies({
        valueKey: `wind:${wind}`,
        kind: 'wind',
        wind,
        label: `${title(wind)} Wind`,
      }),
    );
  }

  return tiles;
}

export function generateFullTileSet(): Tile[] {
  return generateMahjongTileSet();
}

export function createInitialTileValueState(): TileValueState {
  const state: TileValueState = {};

  for (const dragon of DRAGONS) {
    state[`dragon:${dragon}`] = NON_NUMBER_BASE_VALUE;
  }

  for (const wind of WINDS) {
    state[`wind:${wind}`] = NON_NUMBER_BASE_VALUE;
  }

  return state;
}

export function shuffleTiles<T extends Tile>(tiles: T[]): T[] {
  const shuffled = [...tiles];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function dealHand(drawPile: Tile[], count: number): { hand: Tile[]; remainingPile: Tile[] } {
  if (drawPile.length < count) {
    throw new Error(`Cannot deal ${count} tiles from a pile of ${drawPile.length}.`);
  }

  return {
    hand: drawPile.slice(0, count),
    remainingPile: drawPile.slice(count),
  };
}

export function calcTileValue(tile: Tile, tileValueState: TileValueState = {}): number {
  if (tile.kind === 'number') {
    return tile.faceValue ?? 0;
  }

  return tileValueState[tile.valueKey] ?? NON_NUMBER_BASE_VALUE;
}

export function calcHandValue(tiles: Tile[], tileValueState: TileValueState = {}): number {
  return tiles.reduce((total, tile) => total + calcTileValue(tile, tileValueState), 0);
}

export function toHand(tiles: Tile[], tileValueState: TileValueState): { tiles: Tile[]; totalValue: number } {
  return {
    tiles,
    totalValue: calcHandValue(tiles, tileValueState),
  };
}

export function evaluateBet(
  bet: BetDirection,
  previousHandValue: number,
  currentHandValue: number,
): BetResult {
  if (previousHandValue === currentHandValue) {
    return 'tie';
  }

  if (bet === 'higher') {
    return currentHandValue > previousHandValue ? 'correct' : 'incorrect';
  }

  return currentHandValue < previousHandValue ? 'correct' : 'incorrect';
}

export function updateDynamicTileValues(
  tileValueState: TileValueState,
  handTiles: Tile[],
  betResult: BetResult,
): TileValueState {
  if (betResult === 'tie') {
    return { ...tileValueState };
  }

  const delta = betResult === 'correct' ? 1 : -1;
  const nextState = { ...tileValueState };

  for (const tile of handTiles) {
    if (tile.kind === 'dragon' || tile.kind === 'wind') {
      nextState[tile.valueKey] = (nextState[tile.valueKey] ?? NON_NUMBER_BASE_VALUE) + delta;
    }
  }

  return nextState;
}
