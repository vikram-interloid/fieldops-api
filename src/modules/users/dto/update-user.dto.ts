import {
    IsOptional,
    IsString,
    MaxLength,
    ValidateIf,
} from 'class-validator';

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

    // Base64 data URL or remote URL. Explicit `null` clears the photo.
    // ~4 MB cap comfortably fits the 512×512 JPEG the crop dialog produces.
    @IsOptional()
    @ValidateIf((o) => o.avatarUrl !== null)
    @IsString()
    @MaxLength(4_000_000)
    avatarUrl?: string | null;
}