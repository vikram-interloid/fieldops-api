import { IsEmail, IsIn } from 'class-validator';

export class SendOtpDto {
    @IsEmail()
    email: string;

    @IsIn(['REGISTER', 'RESET_PASSWORD'])
    purpose: 'REGISTER' | 'RESET_PASSWORD';
}
