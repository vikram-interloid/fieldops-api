import {
    IsArray,
    IsEmail,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

const STATUSES = ['Available', 'On Job', 'Off Duty'];

export class UpdateTechnicianDto {
    @IsOptional()
    @IsString()
    @MaxLength(150)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(80)
    role?: string;

    @IsOptional()
    @IsString()
    @IsIn(STATUSES)
    status?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    activeJobs?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(5)
    rating?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

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
