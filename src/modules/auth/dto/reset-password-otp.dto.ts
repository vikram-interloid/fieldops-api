import { IsEmail, Matches, MinLength } from 'class-validator';

export class ResetPasswordOtpDto {
    @IsEmail()
    email: string;

    @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code' })
    otp: string;

    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
        message:
            'Password must contain uppercase, lowercase, number and special character',
    })
    password: string;
}
