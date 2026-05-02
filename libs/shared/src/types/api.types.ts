import type { GameState } from './game.types';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: 'GAME_OVER' | 'GAME_NOT_FOUND' | 'INVALID_BET' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR';
    message: string;
  };
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
export type GameResponse = ApiSuccess<GameState>;
