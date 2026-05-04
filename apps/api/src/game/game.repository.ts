import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { LeaderboardEntry, PersistedGameState } from '@tile-game/shared';
import { Game, GameDiscardStack, GameDrawStack, GameHandLedger } from './schemas/game.schema';

type SplitState = Pick<PersistedGameState, 'drawPile' | 'discardPile' | 'handHistory'>;

const splitPersistedState = (state: Partial<PersistedGameState>) => {
  const { drawPile, discardPile, handHistory, ...gameState } = state;

  return {
    gameState,
    splitState: { drawPile, discardPile, handHistory },
  };
};

@Injectable()
export class GameRepository {
  constructor(
    @InjectModel(Game.name) private readonly gameModel: Model<Game>,
    @InjectModel(GameDrawStack.name) private readonly drawStackModel: Model<GameDrawStack>,
    @InjectModel(GameDiscardStack.name) private readonly discardStackModel: Model<GameDiscardStack>,
    @InjectModel(GameHandLedger.name) private readonly handLedgerModel: Model<GameHandLedger>,
  ) {}

  async create(initialState: Partial<PersistedGameState>): Promise<PersistedGameState> {
    const { gameState, splitState } = splitPersistedState(initialState);
    const game = await this.gameModel.create(gameState);
    const gameId = game.gameId;
    const expiresAt = game.expiresAt;

    await Promise.all([
      this.drawStackModel.create({ gameId, tiles: splitState.drawPile ?? [], expiresAt }),
      this.discardStackModel.create({ gameId, tiles: splitState.discardPile ?? [], expiresAt }),
      this.handLedgerModel.create({ gameId, entries: splitState.handHistory ?? [], expiresAt }),
    ]);

    const created = await this.findById(gameId);
    if (!created) {
      throw new NotFoundException({ code: 'GAME_NOT_FOUND', message: 'Game not found.' });
    }

    return created;
  }

  async findById(gameId: string): Promise<PersistedGameState | null> {
    const [game] = await this.gameModel
      .aggregate<PersistedGameState>([
        { $match: { gameId } },
        {
          $lookup: {
            from: 'game_draw_stacks',
            localField: 'gameId',
            foreignField: 'gameId',
            as: 'drawStack',
          },
        },
        {
          $lookup: {
            from: 'game_discard_stacks',
            localField: 'gameId',
            foreignField: 'gameId',
            as: 'discardStack',
          },
        },
        {
          $lookup: {
            from: 'game_hand_ledgers',
            localField: 'gameId',
            foreignField: 'gameId',
            as: 'handLedger',
          },
        },
        {
          $addFields: {
            drawPile: {
              $ifNull: [{ $first: '$drawStack.tiles' }, { $ifNull: ['$drawPile', []] }],
            },
            discardPile: {
              $ifNull: [{ $first: '$discardStack.tiles' }, { $ifNull: ['$discardPile', []] }],
            },
            handHistory: {
              $ifNull: [{ $first: '$handLedger.entries' }, { $ifNull: ['$handHistory', []] }],
            },
          },
        },
        {
          $project: {
            drawStack: 0,
            discardStack: 0,
            handLedger: 0,
            __v: 0,
          },
        },
      ])
      .exec();

    return game ?? null;
  }

  async update(gameId: string, update: Partial<PersistedGameState>): Promise<PersistedGameState> {
    const { gameState, splitState } = splitPersistedState(update);
    const game = await this.gameModel
      .findOneAndUpdate({ gameId }, gameState, { new: true, runValidators: true })
      .exec();

    if (!game) {
      throw new NotFoundException({ code: 'GAME_NOT_FOUND', message: 'Game not found.' });
    }

    await this.updateSplitState(gameId, game.expiresAt, splitState);

    const updated = await this.findById(gameId);
    if (!updated) {
      throw new NotFoundException({ code: 'GAME_NOT_FOUND', message: 'Game not found.' });
    }

    return updated;
  }

  /**
   * Returns the top finished games, sorted by score (desc) then most recently
   * completed. Drives the landing page leaderboard.
   */
  findTopScores(limit: number): Promise<LeaderboardEntry[]> {
    return this.gameModel
      .aggregate<LeaderboardEntry>([
        { $match: { gameOver: true } },
        { $sort: { score: -1, updatedAt: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            gameId: 1,
            score: 1,
            handsPlayed: 1,
            gameOverReason: 1,
            completedAt: '$updatedAt',
          },
        },
      ])
      .exec();
  }

  private async updateSplitState(
    gameId: string,
    expiresAt: Date,
    splitState: Partial<SplitState>,
  ): Promise<void> {
    await Promise.all([
      splitState.drawPile === undefined
        ? Promise.resolve()
        : this.drawStackModel
            .findOneAndUpdate(
              { gameId },
              { $set: { tiles: splitState.drawPile, expiresAt } },
              { upsert: true, runValidators: true },
            )
            .exec(),
      splitState.discardPile === undefined
        ? Promise.resolve()
        : this.discardStackModel
            .findOneAndUpdate(
              { gameId },
              { $set: { tiles: splitState.discardPile, expiresAt } },
              { upsert: true, runValidators: true },
            )
            .exec(),
      splitState.handHistory === undefined
        ? Promise.resolve()
        : this.handLedgerModel
            .findOneAndUpdate(
              { gameId },
              { $set: { entries: splitState.handHistory, expiresAt } },
              { upsert: true, runValidators: true },
            )
            .exec(),
    ]);
  }
}
