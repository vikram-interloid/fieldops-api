import { IsEmail, IsIn, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code' })
  otp: string;

  @IsIn(['REGISTER', 'RESET_PASSWORD'])
  purpose: 'REGISTER' | 'RESET_PASSWORD';
}
