import { 
    IsEmail,
    IsNotEmpty,
    IsString,
    Matches,
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
}