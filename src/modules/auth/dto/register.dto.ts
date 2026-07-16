import {
    IsArray,
    IsEmail,
    IsIn,
    IsLatitude,
    IsLongitude,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsEmail()
    email: string;

    @MinLength(8)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        {
            message: 'Password must contain uppercase, lowercase, number and special character',
        }
    )
    password: string;

    @IsString()
    @IsNotEmpty()
    organizationName: string;

    // Account kind. Defaults to 'customer' when omitted.
    @IsOptional()
    @IsIn(['customer', 'operator'])
    orgType?: 'customer' | 'operator';

    // Operator-only profile (ignored for customer orgs).
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categories?: string[];

    @IsOptional()
    @IsString()
    @MaxLength(120)
    region?: string;

    // Optional HQ location captured from the browser at sign-up. The user is
    // prompted for consent; if they decline, these are omitted and no location
    // record is created.
    @IsOptional()
    @IsLatitude()
    latitude?: number;

    @IsOptional()
    @IsLongitude()
    longitude?: number;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    address?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;
}