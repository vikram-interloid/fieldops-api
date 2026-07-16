import { IsEmail, IsOptional, IsString } from "class-validator";

export class SendEmailDto {
    @IsEmail()
    to: string;

    @IsString()
    subject: string;

    @IsString()
    html: string;

    @IsString()
    @IsOptional()
    text?: string;
}
