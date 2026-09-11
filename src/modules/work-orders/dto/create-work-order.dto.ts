import {
    IsEmail,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
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

export class CreateWorkOrderDto {
    @IsString()
    @IsIn(PRIORITIES)
    priority: string;

    @IsString()
    @IsIn(STATUSES)
    status: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    due: string;

    @IsOptional()
    @IsUUID()
    customerId?: string;

    @IsOptional()
    @IsUUID()
    technicianId?: string;

    @IsOptional()
    @IsUUID()
    assetId?: string;

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
    @IsNumber()
    lat?: number;

    @IsOptional()
    @IsNumber()
    lng?: number;
}
