import { BadRequestException, INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationPipe } from '../src/common/pipes/validation.pipe';
import { AppController } from '../src/app.controller';
import { GameController } from '../src/game/game.controller';
import { GameService } from '../src/game/game.service';

const gameId = '5f787a99-6a77-4d93-93bd-91f0f31d01a5';
const game = {
  gameId,
  score: 0,
  currentHand: {
    tiles: [
      {
        id: 'number:bamboo:6#1',
        valueKey: 'number:bamboo:6',
        kind: 'number',
        suit: 'bamboo',
        faceValue: 6,
        label: '6 Bamboo',
      },
      {
        id: 'dragon:red#1',
        valueKey: 'dragon:red',
        kind: 'dragon',
        dragon: 'red',
        label: 'Red Dragon',
      },
    ],
    totalValue: 11,
  },
  previousHand: null,
  handHistory: [],
  drawPileCount: 26,
  discardPileCount: 0,
  reshuffleCount: 0,
  tileValueState: {
    'dragon:red': 5,
    'dragon:green': 5,
    'dragon:white': 5,
    'wind:east': 5,
    'wind:south': 5,
    'wind:west': 5,
    'wind:north': 5,
  },
  handsPlayed: 1,
  gameOver: false,
  gameOverReason: null,
  lastBetResult: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('Game API e2e', () => {
  let app: INestApplication;
  const service = {
    createGame: jest.fn(async () => game),
    getGame: jest.fn(async (id: string) => {
      if (id === gameId) return game;
      throw new NotFoundException({ code: 'GAME_NOT_FOUND', message: 'Game not found.' });
    }),
    placeBet: jest.fn(async (id: string) => {
      if (id === '00000000-0000-4000-8000-000000000000') {
        throw new BadRequestException({
          code: 'GAME_OVER',
          message: 'This game has already ended.',
        });
      }
      if (id !== gameId) {
        throw new NotFoundException({ code: 'GAME_NOT_FOUND', message: 'Game not found.' });
      }
      return { ...game, score: 1, lastBetResult: 'correct' };
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController, GameController],
      providers: [{ provide: GameService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/games returns a valid game state', async () => {
    const response = await request(app.getHttpServer()).post('/api/games').send({}).expect(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.currentHand.tiles).toHaveLength(2);
    expect(response.body.data.drawPileCount).toBe(26);
  });

  it('GET /api/games/:gameId returns a game', async () => {
    const response = await request(app.getHttpServer()).get(`/api/games/${gameId}`).expect(200);
    expect(response.body.data.gameId).toBe(gameId);
  });

  it('GET /api/games/:gameId returns 404 for unknown game', async () => {
    const unknown = '11111111-1111-4111-8111-111111111111';
    const response = await request(app.getHttpServer()).get(`/api/games/${unknown}`).expect(404);
    expect(response.body.error.code).toBe('GAME_NOT_FOUND');
  });

  it('POST /api/games/:gameId/bet updates a game', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/games/${gameId}/bet`)
      .send({ bet: 'higher' })
      .expect(200);
    expect(response.body.data.score).toBe(1);
  });

  it('POST /api/games/:gameId/bet validates invalid bet values', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/games/${gameId}/bet`)
      .send({ bet: 'sideways' })
      .expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/games/:gameId/bet validates missing bet', async () => {
    await request(app.getHttpServer()).post(`/api/games/${gameId}/bet`).send({}).expect(400);
  });

  it('POST /api/games/:gameId/bet returns 404 for unknown game', async () => {
    const unknown = '11111111-1111-4111-8111-111111111111';
    await request(app.getHttpServer())
      .post(`/api/games/${unknown}/bet`)
      .send({ bet: 'lower' })
      .expect(404);
  });

  it('POST /api/games/:gameId/bet returns GAME_OVER', async () => {
    const ended = '00000000-0000-4000-8000-000000000000';
    const response = await request(app.getHttpServer())
      .post(`/api/games/${ended}/bet`)
      .send({ bet: 'lower' })
      .expect(400);
    expect(response.body.error.code).toBe('GAME_OVER');
  });

  it('GET /api/health returns ok', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({ status: 'ok' });
    expect(typeof response.body.timestamp).toBe('string');
  });
});
