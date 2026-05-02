import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BetDirection,
  checkGameOverFromHand,
  checkGameOverFromReshuffle,
  createInitialTileValueState,
  dealHand,
  evaluateBet,
  GameState,
  generateFullTileSet,
  HandHistoryEntry,
  LeaderboardEntry,
  PersistedGameState,
  shuffleTiles,
  toHand,
  updateDynamicTileValues,
} from '@tile-game/shared';
import { randomUUID } from 'crypto';
import { GameRepository } from './game.repository';
import { GameDocument } from './schemas/game.schema';

const HAND_SIZE = 2;
const HISTORY_LIMIT = 10;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class GameService {
  constructor(private readonly repository: GameRepository) {}

  async createGame(): Promise<GameState> {
    const now = new Date();
    const tileValueState = createInitialTileValueState();
    const { hand: tiles, remainingPile } = dealHand(shuffleTiles(generateFullTileSet()), HAND_SIZE);
    const currentHand = toHand(tiles, tileValueState);

    const game = await this.repository.create({
      gameId: randomUUID(),
      score: 0,
      currentHand,
      previousHand: null,
      handHistory: [],
      drawPile: remainingPile,
      discardPile: [],
      drawPileCount: remainingPile.length,
      discardPileCount: 0,
      reshuffleCount: 0,
      tileValueState,
      handsPlayed: 1,
      gameOver: false,
      gameOverReason: null,
      lastBetResult: null,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + ONE_DAY_MS),
    });

    return this.toGameState(game);
  }

  async getGame(gameId: string): Promise<GameState> {
    const game = await this.repository.findById(gameId);

    if (!game) {
      throw new NotFoundException({ code: 'GAME_NOT_FOUND', message: 'Game not found.' });
    }

    return this.toGameState(game);
  }

  async placeBet(gameId: string, bet: BetDirection): Promise<GameState> {
    const game = await this.repository.findById(gameId);

    if (!game) {
      throw new NotFoundException({ code: 'GAME_NOT_FOUND', message: 'Game not found.' });
    }

    if (game.gameOver || !game.currentHand) {
      throw new BadRequestException({
        code: 'GAME_OVER',
        message: 'This game has already ended.',
      });
    }

    let drawPile = [...game.drawPile];
    let discardPile = [...game.discardPile];
    let reshuffleCount = game.reshuffleCount;
    let gameOver = false;
    let gameOverReason = game.gameOverReason;

    if (drawPile.length < HAND_SIZE) {
      drawPile = shuffleTiles([...drawPile, ...discardPile, ...generateFullTileSet()]);
      discardPile = [];
      reshuffleCount += 1;
    }

    const reshuffleGameOver = checkGameOverFromReshuffle(reshuffleCount);
    const { hand: nextTiles, remainingPile } = dealHand(drawPile, HAND_SIZE);
    const previousHand = game.currentHand;
    const preScaleCurrentHand = toHand(nextTiles, game.tileValueState);
    const betResult = evaluateBet(bet, previousHand.totalValue, preScaleCurrentHand.totalValue);
    const tileValueState = updateDynamicTileValues(game.tileValueState, nextTiles, betResult);
    const currentHand = toHand(nextTiles, tileValueState);
    const handGameOver = checkGameOverFromHand(nextTiles, tileValueState);

    if (reshuffleGameOver) {
      gameOver = true;
      gameOverReason = 'max_reshuffles';
    }

    if (handGameOver.isGameOver) {
      gameOver = true;
      gameOverReason = handGameOver.reason;
    }

    const historyEntry: HandHistoryEntry = {
      hand: previousHand,
      handIndex: game.handsPlayed,
      betPlaced: bet,
      betCorrect: betResult === 'correct',
      betResult,
    };

    discardPile = [...discardPile, ...previousHand.tiles];

    const updated = await this.repository.update(gameId, {
      score: game.score + (betResult === 'correct' ? 1 : 0),
      previousHand,
      currentHand,
      handHistory: [...game.handHistory, historyEntry].slice(-HISTORY_LIMIT),
      drawPile: remainingPile,
      discardPile,
      drawPileCount: remainingPile.length,
      discardPileCount: discardPile.length,
      reshuffleCount,
      tileValueState,
      handsPlayed: game.handsPlayed + 1,
      gameOver,
      gameOverReason,
      lastBetResult: betResult,
      updatedAt: new Date(),
    });

    return this.toGameState(updated);
  }

  async getLeaderboard(limit = 5): Promise<LeaderboardEntry[]> {
    const games = await this.repository.findTopScores(limit);
    return games.map((game) => ({
      gameId: game.gameId,
      score: game.score,
      handsPlayed: game.handsPlayed,
      gameOverReason: game.gameOverReason,
      completedAt: game.updatedAt,
    }));
  }

  private toGameState(game: GameDocument | PersistedGameState): GameState {
    return {
      gameId: game.gameId,
      score: game.score,
      currentHand: game.currentHand,
      previousHand: game.previousHand,
      handHistory: game.handHistory,
      drawPileCount: game.drawPileCount,
      discardPileCount: game.discardPileCount,
      reshuffleCount: game.reshuffleCount,
      tileValueState: game.tileValueState,
      handsPlayed: game.handsPlayed,
      gameOver: game.gameOver,
      gameOverReason: game.gameOverReason,
      lastBetResult: game.lastBetResult,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };
  }
}
