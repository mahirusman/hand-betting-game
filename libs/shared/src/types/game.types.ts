export type TileKind = 'number' | 'dragon' | 'wind';
export type TileSuit = 'bamboo' | 'characters' | 'dots';
export type DragonTile = 'red' | 'green' | 'white';
export type WindTile = 'east' | 'south' | 'west' | 'north';

export interface MahjongTile {
  id: string;
  valueKey: string;
  kind: TileKind;
  label: string;
  suit?: TileSuit;
  faceValue?: number;
  dragon?: DragonTile;
  wind?: WindTile;
}

export type Tile = MahjongTile;
export type TileValue = number;
export type TileValueState = Record<string, number>;

export interface Hand {
  tiles: Tile[];
  totalValue: number;
}

export type BetDirection = 'higher' | 'lower';
export type BetResult = 'correct' | 'incorrect' | 'tie';
export type GameOverReason = 'tile_value_zero' | 'tile_value_ten' | 'max_reshuffles';

export interface HandHistoryEntry {
  hand: Hand;
  handIndex: number;
  betPlaced: BetDirection | null;
  betCorrect: boolean | null;
  betResult: BetResult | null;
}

export interface GameState {
  gameId: string;
  score: number;
  currentHand: Hand | null;
  previousHand: Hand | null;
  handHistory: HandHistoryEntry[];
  drawPileCount: number;
  discardPileCount: number;
  reshuffleCount: number;
  tileValueState: TileValueState;
  handsPlayed: number;
  gameOver: boolean;
  gameOverReason: GameOverReason | null;
  lastBetResult: BetResult | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistedGameState extends GameState {
  drawPile: Tile[];
  discardPile: Tile[];
  expiresAt: Date;
}

export interface LeaderboardEntry {
  gameId: string;
  score: number;
  handsPlayed: number;
  gameOverReason: GameOverReason | null;
  completedAt: Date;
}
