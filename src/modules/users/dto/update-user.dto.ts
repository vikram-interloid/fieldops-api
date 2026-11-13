import { IsBoolean, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isOrgAdmin?: boolean;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  // Base64 data URL or remote URL. Explicit `null` clears the photo.
  // ~4 MB cap comfortably fits the 512×512 JPEG the crop dialog produces.
  @IsOptional()
  @ValidateIf((o) => o.avatarUrl !== null)
  @IsString()
  @MaxLength(4_000_000)
  avatarUrl?: string | null;

  // S3 storage key for CloudFront signed serving. Explicit `null` clears the photo.
  @IsOptional()
  @ValidateIf((o) => o.avatarKey !== null)
  @IsString()
  @MaxLength(500)
  avatarKey?: string | null;
}
