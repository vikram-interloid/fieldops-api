import { IsInt } from 'class-validator';

export class AdjustQuantityDto {
  @IsInt()
  delta: number;
}
