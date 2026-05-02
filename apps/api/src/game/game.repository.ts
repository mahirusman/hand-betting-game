import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { PersistedGameState } from '@tile-game/shared';
import { Game, GameDocument } from './schemas/game.schema';

@Injectable()
export class GameRepository {
  constructor(@InjectModel(Game.name) private readonly gameModel: Model<Game>) {}

  create(initialState: Partial<PersistedGameState>): Promise<GameDocument> {
    return this.gameModel.create(initialState);
  }

  findById(gameId: string): Promise<GameDocument | null> {
    return this.gameModel.findOne({ gameId }).exec();
  }

  async update(gameId: string, update: Partial<PersistedGameState>): Promise<GameDocument> {
    const game = await this.gameModel
      .findOneAndUpdate({ gameId }, update, { new: true, runValidators: true })
      .exec();

    if (!game) {
      throw new NotFoundException({ code: 'GAME_NOT_FOUND', message: 'Game not found.' });
    }

    return game;
  }

  /**
   * Returns the top finished games, sorted by score (desc) then most recently
   * completed. Drives the landing page leaderboard.
   */
  findTopScores(limit: number): Promise<GameDocument[]> {
    return this.gameModel
      .find({ gameOver: true })
      .sort({ score: -1, updatedAt: -1 })
      .limit(limit)
      .exec();
  }
}
