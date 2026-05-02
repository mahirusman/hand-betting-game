import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import type {
  BetResult,
  GameOverReason,
  Hand,
  HandHistoryEntry,
  Tile,
  TileValueState,
} from '@tile-game/shared';

export type GameDocument = HydratedDocument<Game>;

const TileSchema = new MongooseSchema(
  {
    id: { type: String, required: true },
    valueKey: { type: String, required: true },
    kind: { type: String, required: true, enum: ['number', 'dragon', 'wind'] },
    label: { type: String, required: true },
    suit: { type: String, enum: ['bamboo', 'characters', 'dots'] },
    faceValue: { type: Number, min: 1, max: 9 },
    dragon: { type: String, enum: ['red', 'green', 'white'] },
    wind: { type: String, enum: ['east', 'south', 'west', 'north'] },
  },
  { _id: false },
);

const HandSchema = new MongooseSchema(
  {
    tiles: { type: [TileSchema], required: true },
    totalValue: { type: Number, required: true },
  },
  { _id: false },
);

const HandHistoryEntrySchema = new MongooseSchema(
  {
    hand: { type: HandSchema, required: true },
    handIndex: { type: Number, required: true },
    betPlaced: { type: String, enum: ['higher', 'lower'], default: null },
    betCorrect: { type: Boolean, default: null },
    betResult: { type: String, enum: ['correct', 'incorrect', 'tie'], default: null },
  },
  { _id: false },
);

@Schema({ timestamps: true, collection: 'games' })
export class Game {
  @Prop({ required: true })
  gameId!: string;

  @Prop({ required: true, default: 0 })
  score!: number;

  @Prop({ type: HandSchema, default: null })
  currentHand!: Hand | null;

  @Prop({ type: HandSchema, default: null })
  previousHand!: Hand | null;

  @Prop({ type: [HandHistoryEntrySchema], default: [] })
  handHistory!: HandHistoryEntry[];

  @Prop({ type: [TileSchema], required: true })
  drawPile!: Tile[];

  @Prop({ type: [TileSchema], default: [] })
  discardPile!: Tile[];

  @Prop({ required: true, default: 0 })
  drawPileCount!: number;

  @Prop({ required: true, default: 0 })
  discardPileCount!: number;

  @Prop({ required: true, default: 0 })
  reshuffleCount!: number;

  @Prop({ type: Object, required: true, default: {} })
  tileValueState!: TileValueState;

  @Prop({ required: true, default: 0 })
  handsPlayed!: number;

  @Prop({ required: true, default: false })
  gameOver!: boolean;

  @Prop({ type: String, default: null })
  gameOverReason!: GameOverReason | null;

  @Prop({ type: String, default: null })
  lastBetResult!: BetResult | null;

  @Prop({ type: Date, required: true })
  createdAt!: Date;

  @Prop({ type: Date, required: true })
  updatedAt!: Date;

  @Prop({ type: Date, required: true, expires: 0 })
  expiresAt!: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);
GameSchema.index({ gameId: 1 }, { unique: true });
GameSchema.index({ createdAt: 1 });
GameSchema.index({ gameOver: 1, score: -1, updatedAt: -1 });
