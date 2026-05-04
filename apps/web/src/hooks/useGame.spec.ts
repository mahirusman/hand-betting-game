import type { GameState } from '@tile-game/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from './useGame';
import * as api from '../lib/api-client';

vi.mock('../lib/api-client', () => ({
  createGame: vi.fn(),
  placeBet: vi.fn(),
}));

function gameState(overrides: Partial<GameState> = {}): GameState {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    gameId: '5f787a99-6a77-4d93-93bd-91f0f31d01a5',
    score: 0,
    currentHand: { tiles: [], totalValue: 6 },
    previousHand: null,
    handHistory: [],
    drawPileCount: 24,
    discardPileCount: 0,
    reshuffleCount: 0,
    tileValueState: {},
    handsPlayed: 1,
    gameOver: false,
    gameOverReason: null,
    lastBetResult: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('useGame store', () => {
  beforeEach(() => {
    useGameStore.setState({ gameId: null, gameState: null, isLoading: false, error: null });
    vi.resetAllMocks();
  });

  it('starts a new game and stores state', async () => {
    const created = gameState();
    vi.mocked(api.createGame).mockResolvedValue(created);

    await useGameStore.getState().startNewGame();
    const state = useGameStore.getState();

    expect(state.gameId).toBe(created.gameId);
    expect(state.gameState).toEqual(created);
    expect(state.error).toBeNull();
  });

  it('places a bet and updates game state', async () => {
    const created = gameState();
    const updated = gameState({ score: 1, lastBetResult: 'correct' });
    vi.mocked(api.createGame).mockResolvedValue(created);
    vi.mocked(api.placeBet).mockResolvedValue(updated);

    await useGameStore.getState().startNewGame();
    await useGameStore.getState().placeBet('higher');

    const state = useGameStore.getState();
    expect(api.placeBet).toHaveBeenCalledWith(created.gameId, 'higher');
    expect(state.gameState?.score).toBe(1);
  });

  it('sets error when placing bet without game', async () => {
    await useGameStore.getState().placeBet('lower');
    expect(useGameStore.getState().error).toMatch(/start a game/i);
  });
});
