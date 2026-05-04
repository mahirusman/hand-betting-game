/**
 * Single source of truth for tunable game rules. Both the API and the web app
 * import these constants from `@tile-game/shared` so any change here cascades
 * through the engine, DTO validation, and UI without scattered edits.
 */

import type { BetDirection } from '../types/game.types';

/** Number of tiles dealt per hand. */
export const HAND_SIZE = 2;

/** Tiles drawn from the top of a freshly shuffled deck when the draw pile is replenished. */
export const FRESH_DRAW_PILE_SIZE = 28;

/** Maximum number of past hands the API keeps on the game document. */
export const HISTORY_LIMIT = 10;

/** How many history entries the UI shows in the recent hands strip. */
export const HISTORY_VISIBLE = 5;

/** The game ends on the Nth reshuffle (the spec calls this "the third reshuffle"). */
export const MAX_RESHUFFLES = 3;

/** How many entries the leaderboard returns. */
export const LEADERBOARD_LIMIT = 5;

/** Starting value for any non-number tile (dragons + winds). */
export const BASE_NON_NUMBER_VALUE = 5;

/** Game over when any tile value falls to this floor. */
export const GAME_OVER_LOW = 0;

/** Game over when any tile value rises to this ceiling. */
export const GAME_OVER_HIGH = 10;

/** Number of physical copies of each unique tile valueKey in a fresh deck. */
export const TILES_PER_VALUE_KEY = 4;

/** How long a created game lives before MongoDB TTL drops it. */
export const GAME_TTL_MS = 24 * 60 * 60 * 1000;

/** Single source of truth for the allowed bet directions. */
export const BET_DIRECTIONS: readonly BetDirection[] = ['higher', 'lower'] as const;
