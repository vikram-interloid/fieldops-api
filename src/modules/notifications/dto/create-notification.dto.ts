import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const TYPES = ['info', 'success', 'warning', 'danger'];

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsIn(TYPES)
  type: string;
}
