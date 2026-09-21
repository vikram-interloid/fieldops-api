import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTableViewDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  filters?: unknown;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;
}
