import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameController } from './game.controller';
import { GameRepository } from './game.repository';
import { GameService } from './game.service';
import {
  Game,
  GameDiscardStack,
  GameDiscardStackSchema,
  GameDrawStack,
  GameDrawStackSchema,
  GameHandLedger,
  GameHandLedgerSchema,
  GameSchema,
} from './schemas/game.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameSchema },
      { name: GameDrawStack.name, schema: GameDrawStackSchema },
      { name: GameDiscardStack.name, schema: GameDiscardStackSchema },
      { name: GameHandLedger.name, schema: GameHandLedgerSchema },
    ]),
  ],
  controllers: [GameController],
  providers: [GameService, GameRepository],
  exports: [GameService, GameRepository],
})
export class GameModule {}
