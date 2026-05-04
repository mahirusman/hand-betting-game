import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { PersistedGameState, Tile } from '@tile-game/shared';
import { createInitialTileValueState, generateFullTileSet, toHand } from '@tile-game/shared';
import { GameRepository } from '../src/game/game.repository';
import { GameService } from '../src/game/game.service';

const findTile = (valueKey: string): Tile =>
  generateFullTileSet().find((tile) => tile.valueKey === valueKey)!;

const currentTiles = [findTile('number:bamboo:2'), findTile('number:dots:4')];

const baseGame = (): PersistedGameState => {
  const tileValueState = createInitialTileValueState();

  return {
    gameId: '5f787a99-6a77-4d93-93bd-91f0f31d01a5',
    score: 0,
    currentHand: toHand(currentTiles, tileValueState),
    previousHand: null,
    handHistory: [],
    drawPile: [findTile('number:bamboo:9'), findTile('number:dots:1'), findTile('dragon:red')],
    discardPile: [],
    drawPileCount: 3,
    discardPileCount: 0,
    reshuffleCount: 0,
    tileValueState,
    handsPlayed: 1,
    gameOver: false,
    gameOverReason: null,
    lastBetResult: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    expiresAt: new Date('2026-01-02T00:00:00Z'),
  };
};

describe('GameService', () => {
  let service: GameService;
  let stored: PersistedGameState | null;

  beforeEach(async () => {
    stored = baseGame();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: GameRepository,
          useValue: {
            create: jest.fn(async (state: PersistedGameState) => state),
            findById: jest.fn(async () => stored),
            update: jest.fn(async (_id: string, update: Partial<PersistedGameState>) => {
              stored = { ...stored!, ...update };
              return stored;
            }),
            findTopScores: jest.fn(async () => (stored ? [stored] : [])),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(GameService);
  });

  it('creates a game with a first hand and 26 remaining draw tiles', async () => {
    const game = await service.createGame();
    expect(game.score).toBe(0);
    expect(game.currentHand?.tiles).toHaveLength(2);
    expect(game.drawPileCount).toBe(26);
    expect(game.discardPileCount).toBe(0);
    expect(game.reshuffleCount).toBe(0);
    expect(game.handsPlayed).toBe(1);
    expect(game.gameOver).toBe(false);
  });

  it('increments score on correct bet and updates hands/history/discard pile', async () => {
    stored = {
      ...baseGame(),
      drawPile: [findTile('number:bamboo:9'), findTile('number:dots:1')],
      drawPileCount: 2,
    };

    const game = await service.placeBet(stored.gameId, 'higher');

    expect(game.score).toBe(1);
    expect(game.previousHand?.totalValue).toBe(6);
    expect(game.currentHand?.totalValue).toBe(10);
    expect(game.handHistory).toHaveLength(1);
    expect(game.discardPileCount).toBe(2);
    expect(game.handsPlayed).toBe(2);
  });

  it('does not increment score on tie bets', async () => {
    stored = {
      ...baseGame(),
      drawPile: [findTile('number:bamboo:2'), findTile('number:dots:4')],
      drawPileCount: 2,
    };

    const game = await service.placeBet(stored.gameId, 'higher');
    expect(game.score).toBe(0);
    expect(game.lastBetResult).toBe('tie');
  });

  it('scales Dragon and Wind values after wins and losses', async () => {
    stored = {
      ...baseGame(),
      drawPile: [findTile('dragon:red'), findTile('number:dots:2')],
      drawPileCount: 2,
    };

    const won = await service.placeBet(stored.gameId, 'higher');
    expect(won.score).toBe(1);
    expect(won.tileValueState['dragon:red']).toBe(6);

    stored = {
      ...baseGame(),
      drawPile: [findTile('dragon:red'), findTile('number:dots:2')],
      drawPileCount: 2,
    };

    const lost = await service.placeBet(stored.gameId, 'lower');
    expect(lost.score).toBe(0);
    expect(lost.tileValueState['dragon:red']).toBe(4);
  });

  it('throws when game is already over', async () => {
    stored = { ...baseGame(), gameOver: true };
    await expect(service.placeBet(stored.gameId, 'higher')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when game is missing', async () => {
    stored = null;
    await expect(service.getGame('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ends when a dynamic tile value reaches zero or ten', async () => {
    stored = {
      ...baseGame(),
      drawPile: [findTile('dragon:red'), findTile('number:bamboo:1')],
      drawPileCount: 2,
      tileValueState: { ...createInitialTileValueState(), 'dragon:red': 1 },
    };
    await expect(service.placeBet(stored.gameId, 'higher')).resolves.toMatchObject({
      gameOver: true,
      gameOverReason: 'tile_value_zero',
    });

    stored = {
      ...baseGame(),
      drawPile: [findTile('dragon:red'), findTile('number:bamboo:1')],
      drawPileCount: 2,
      tileValueState: { ...createInitialTileValueState(), 'dragon:red': 9 },
    };
    await expect(service.placeBet(stored.gameId, 'higher')).resolves.toMatchObject({
      gameOver: true,
      gameOverReason: 'tile_value_ten',
    });
  });

  it('ends on third reshuffle', async () => {
    stored = {
      ...baseGame(),
      drawPile: [],
      drawPileCount: 0,
      reshuffleCount: 2,
    };
    const game = await service.placeBet(stored.gameId, 'higher');
    expect(game.gameOver).toBe(true);
    expect(game.gameOverReason).toBe('max_reshuffles');
  });

  it('uses the stored handsPlayed counter for leaderboard rows', async () => {
    stored = { ...baseGame(), gameOver: true, score: 12, handsPlayed: 18 };
    await expect(service.getLeaderboard()).resolves.toMatchObject([
      {
        score: 12,
        handsPlayed: 18,
      },
    ]);
  });
});
