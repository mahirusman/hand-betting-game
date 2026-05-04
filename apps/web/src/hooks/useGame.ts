'use client';

import axios from 'axios';
import { create } from 'zustand';
import type { ApiError, BetDirection, GameState } from '@tile-game/shared';
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

/**
 * Pulls a human-readable message from API errors. The backend always wraps
 * failures in `{ success: false, error: { code, message }, timestamp }` (see
 * apps/api/src/common/filters/http-exception.filter.ts), so for axios errors
 * we read the wrapped payload first and fall back to axios's own message.
 */
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: ApiError['error'] } | undefined;
    if (payload?.error?.message) return payload.error.message;
    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
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
