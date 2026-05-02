import axios from 'axios';
import type { ApiSuccess, BetDirection, GameState, LeaderboardEntry } from '@tile-game/shared';

const client = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api`,
  timeout: 10_000,
});

export async function createGame(): Promise<GameState> {
  const response = await client.post<ApiSuccess<GameState>>('/games', {});
  return response.data.data;
}

export async function fetchGame(gameId: string): Promise<GameState> {
  const response = await client.get<ApiSuccess<GameState>>(`/games/${gameId}`);
  return response.data.data;
}

export async function placeBet(gameId: string, bet: BetDirection): Promise<GameState> {
  const response = await client.post<ApiSuccess<GameState>>(`/games/${gameId}/bet`, { bet });
  return response.data.data;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await client.get<ApiSuccess<LeaderboardEntry[]>>('/games/leaderboard');
  return response.data.data;
}
