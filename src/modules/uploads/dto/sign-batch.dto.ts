import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SignBatchDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  keys: string[];

  @IsOptional()
  @IsNumber()
  expiresInSeconds?: number;
}
