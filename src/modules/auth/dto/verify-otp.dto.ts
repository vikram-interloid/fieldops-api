import { IsEmail, IsIn, Matches } from 'class-validator';

export class VerifyOtpDto {
    @IsEmail()
    email: string;

    @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code' })
    code: string;

    @IsIn(['register', 'reset'])
    purpose: 'register' | 'reset';
}
