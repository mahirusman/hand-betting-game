import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { BetDirection } from '@tile-game/shared';

export class PlaceBetDto {
  @ApiProperty({ enum: ['higher', 'lower'] })
  @IsIn(['higher', 'lower'])
  bet!: BetDirection;
}
