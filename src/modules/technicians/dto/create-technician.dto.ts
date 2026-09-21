import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const STATUSES = ['Available', 'On Job', 'Off Duty'];

export class CreateTechnicianDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  role: string;

  @IsString()
  @IsIn(STATUSES)
  status: string;

  @IsInt()
  @Min(0)
  activeJobs: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  employeeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  hireDate?: string;
}
