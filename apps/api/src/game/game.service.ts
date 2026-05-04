import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BetDirection,
  checkGameOverFromReshuffle,
  checkTileValueGameOver,
  createInitialTileValueState,
  dealHand,
  evaluateBet,
  FRESH_DRAW_PILE_SIZE,
  GAME_TTL_MS,
  GameState,
  generateFullTileSet,
  HAND_SIZE,
  HandHistoryEntry,
  HISTORY_LIMIT,
  LEADERBOARD_LIMIT,
  LeaderboardEntry,
  PersistedGameState,
  shuffleTiles,
  toHand,
  updateDynamicTileValues,
} from '@tile-game/shared';
import { randomUUID } from 'crypto';
import { GameRepository } from './game.repository';

@Injectable()
export class GameService {
  constructor(private readonly repository: GameRepository) {}

  async createGame(): Promise<GameState> {
    const now = new Date();
    const tileValueState = createInitialTileValueState();
    const { hand: tiles, remainingPile } = dealHand(this.createFreshDrawPile(), HAND_SIZE);
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
      expiresAt: new Date(now.getTime() + GAME_TTL_MS),
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

    if (drawPile.length === 0) {
      drawPile = shuffleTiles([...discardPile, ...this.createFreshDrawPile()]);
      discardPile = [];
      reshuffleCount += 1;
    }

    const reshuffleGameOver = checkGameOverFromReshuffle(reshuffleCount);
    const { hand: nextTiles, remainingPile } = dealHand(drawPile, HAND_SIZE);
    const previousHand = game.currentHand;

    /*
     * Two-stage bet evaluation. The provisional pass uses the tile state that
     * was active when the player placed their bet. We then apply the dynamic
     * +1/-1 scaling and re-evaluate the bet against the post-scale hand value
     * so the outcome the player sees ("previous 10, current 12 → ✓ Higher")
     * always agrees with the displayed numbers.
     *
     * In rare boundary cases — a non-number tile flipping the comparison — the
     * provisional and final results can differ. The scaling delta has already
     * been applied based on the provisional read; we treat the post-scale
     * value as the authoritative outcome for scoring and game-over checks.
     */
    const provisionalHand = toHand(nextTiles, game.tileValueState);
    const provisionalResult = evaluateBet(bet, previousHand.totalValue, provisionalHand.totalValue);
    const tileValueState = updateDynamicTileValues(
      game.tileValueState,
      nextTiles,
      provisionalResult,
    );
    const currentHand = toHand(nextTiles, tileValueState);
    const betResult = evaluateBet(bet, previousHand.totalValue, currentHand.totalValue);

    const tileGameOver = checkTileValueGameOver(nextTiles, tileValueState);

    if (reshuffleGameOver) {
      gameOver = true;
      gameOverReason = 'max_reshuffles';
    }

    if (tileGameOver.isGameOver) {
      gameOver = true;
      gameOverReason = tileGameOver.reason;
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

  async getLeaderboard(limit = LEADERBOARD_LIMIT): Promise<LeaderboardEntry[]> {
    return this.repository.findTopScores(limit);
  }

  private toGameState(game: PersistedGameState): GameState {
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

  private createFreshDrawPile() {
    return shuffleTiles(generateFullTileSet()).slice(0, FRESH_DRAW_PILE_SIZE);
  }
}
