import {
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

const STATUSES = ['New', 'In Review', 'Converted', 'Rejected'];
const SERVICE_TYPES = [
    'Installation',
    'Repair',
    'Maintenance',
    'Inspection',
    'Emergency',
];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export class UpdateCaseDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    subject?: string;

    @IsOptional()
    @IsString()
    @MinLength(5)
    description?: string;

    @IsOptional()
    @IsString()
    @IsIn(SERVICE_TYPES)
    serviceType?: string;

    @IsOptional()
    @IsString()
    @IsIn(PRIORITIES)
    priority?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsInt()
    customerId?: number;

    @IsOptional()
    @IsString()
    @IsIn(STATUSES)
    status?: string;
}
