import { IsEmail, IsInt, IsString, Min } from 'class-validator';

export class SendOtpEmailDto {
    @IsEmail()
    to: string;

    @IsString()
    name: string;

    @IsString()
    otp: string;

    @IsInt()
    @Min(1)
    expiryMinutes: number;
}