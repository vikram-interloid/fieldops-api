import {
    IsBoolean,
    IsEmail,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

const STATUSES = ['Open', 'In Progress', 'Overdue', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const SERVICE_TYPES = [
    'Installation',
    'Repair',
    'Maintenance',
    'Inspection',
    'Emergency',
];

export class UpdateWorkOrderDto {
    @IsOptional()
    @IsString()
    @IsIn(PRIORITIES)
    priority?: string;

    @IsOptional()
    @IsString()
    @IsIn(STATUSES)
    status?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    due?: string;

    @IsOptional()
    @IsInt()
    customerId?: number;

    @IsOptional()
    @IsInt()
    technicianId?: number;

    @IsOptional()
    @IsInt()
    assetId?: number;

    @IsOptional()
    @IsString()
    @IsIn(SERVICE_TYPES)
    serviceType?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    location?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    contactName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    contactPhone?: string;

    @IsOptional()
    @IsEmail()
    @MaxLength(150)
    contactEmail?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    scheduledDate?: string;

    @IsOptional()
    @IsNumber()
    estimatedHours?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    accepted?: boolean;

    @IsOptional()
    @IsNumber()
    lat?: number;

    @IsOptional()
    @IsNumber()
    lng?: number;
}
