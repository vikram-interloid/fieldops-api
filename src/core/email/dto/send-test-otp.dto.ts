import { IsEmail } from 'class-validator';

export class SendTestOtpDto {
    @IsEmail()
    to: string;
}