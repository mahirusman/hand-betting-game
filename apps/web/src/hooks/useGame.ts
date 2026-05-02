'use client';

import { create } from 'zustand';
import type { BetDirection, GameState } from '@tile-game/shared';
import * as api from '../lib/api-client';

interface GameStore {
  gameId: string | null;
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  startNewGame: () => Promise<void>;
  placeBet: (bet: BetDirection) => Promise<void>;
  exitGame: () => void;
  clearError: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Something went wrong.';
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameId: null,
  gameState: null,
  isLoading: false,
  error: null,

  async startNewGame() {
    set({ isLoading: true, error: null });

    try {
      const gameState = await api.createGame();
      set({ gameId: gameState.gameId, gameState, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  async placeBet(bet) {
    const { gameId } = get();

    if (!gameId) {
      set({ error: 'Start a game before placing a bet.' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const gameState = await api.placeBet(gameId, bet);
      set({ gameState, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  exitGame() {
    set({ gameId: null, gameState: null, error: null, isLoading: false });
  },

  clearError() {
    set({ error: null });
  },
}));

export function useGame() {
  return useGameStore();
}
