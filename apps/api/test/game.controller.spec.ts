import { Test } from '@nestjs/testing';
import { GameController } from '../src/game/game.controller';
import { GameService } from '../src/game/game.service';

describe('GameController', () => {
  it('wraps create game responses in the success envelope', async () => {
    const game = {
      gameId: '5f787a99-6a77-4d93-93bd-91f0f31d01a5',
      score: 0,
      currentHand: null,
      previousHand: null,
      handHistory: [],
      drawPileCount: 134,
      discardPileCount: 0,
      reshuffleCount: 0,
      tileValueState: {},
      handsPlayed: 1,
      gameOver: false,
      gameOverReason: null,
      lastBetResult: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [GameController],
      providers: [{ provide: GameService, useValue: { createGame: jest.fn(async () => game) } }],
    }).compile();

    await expect(moduleRef.get(GameController).createGame({})).resolves.toMatchObject({
      success: true,
      data: game,
    });
  });
});
