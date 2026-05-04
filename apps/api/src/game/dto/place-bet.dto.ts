import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { BET_DIRECTIONS, type BetDirection } from '@tile-game/shared';

/**
 * The validator pulls allowed values from the shared BET_DIRECTIONS const so
 * the DTO cannot drift from the BetDirection union the engine consumes.
 */
const ALLOWED_BETS: BetDirection[] = [...BET_DIRECTIONS];

export class PlaceBetDto {
  @ApiProperty({ enum: ALLOWED_BETS })
  @IsIn(ALLOWED_BETS)
  bet!: BetDirection;
}
