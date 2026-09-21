import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { SERVICE_CATEGORIES } from '../constants/operator.constants';

export class CreateServiceAreaDto {
  @IsIn(SERVICE_CATEGORIES as unknown as string[])
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  postalPrefix?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  radiusKm?: number;
}
