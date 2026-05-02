import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { GameState, LeaderboardEntry } from '@tile-game/shared';
import { CreateGameDto } from './dto/create-game.dto';
import { PlaceBetDto } from './dto/place-bet.dto';
import { GameService } from './game.service';

const envelope = <T>(data: T) => ({
  success: true as const,
  data,
  timestamp: new Date().toISOString(),
});

@ApiTags('games')
@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Creates a new game.' })
  createGame(@Body() _dto: CreateGameDto): Promise<{ success: true; data: GameState; timestamp: string }> {
    return this.gameService.createGame().then(envelope);
  }

  // IMPORTANT: this route must come before `:gameId` so the ParseUUIDPipe on
  // that handler doesn't try to parse "leaderboard" as a UUID.
  @Get('leaderboard')
  @ApiOkResponse({ description: 'Returns the top 5 finished games by score.' })
  getLeaderboard(): Promise<{ success: true; data: LeaderboardEntry[]; timestamp: string }> {
    return this.gameService.getLeaderboard(5).then(envelope);
  }

  @Get(':gameId')
  @ApiParam({ name: 'gameId', format: 'uuid' })
  @ApiOkResponse({ description: 'Returns an existing game.' })
  @ApiNotFoundResponse({ description: 'Game not found.' })
  getGame(
    @Param('gameId', new ParseUUIDPipe({ version: '4' })) gameId: string,
  ): Promise<{ success: true; data: GameState; timestamp: string }> {
    return this.gameService.getGame(gameId).then(envelope);
  }

  @Post(':gameId/bet')
  @HttpCode(200)
  @ApiParam({ name: 'gameId', format: 'uuid' })
  @ApiOkResponse({ description: 'Places a higher/lower bet and returns updated game state.' })
  @ApiBadRequestResponse({ description: 'Invalid bet or game already over.' })
  @ApiNotFoundResponse({ description: 'Game not found.' })
  placeBet(
    @Param('gameId', new ParseUUIDPipe({ version: '4' })) gameId: string,
    @Body() dto: PlaceBetDto,
  ): Promise<{ success: true; data: GameState; timestamp: string }> {
    return this.gameService.placeBet(gameId, dto.bet).then(envelope);
  }
}
