import {
    IsIn,
    IsInt,
    IsNotEmpty,
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

export class CreateCaseDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    subject: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    description: string;

    @IsString()
    @IsIn(SERVICE_TYPES)
    serviceType: string;

    @IsString()
    @IsIn(PRIORITIES)
    priority: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsOptional()
    @IsInt()
    customerId?: number;

    @IsOptional()
    @IsString()
    category?: string;

    // Operator directory record the customer would prefer (soft hint).
    @IsOptional()
    @IsInt()
    preferredOperatorId?: number;

    @IsOptional()
    @IsString()
    @IsIn(STATUSES)
    status?: string;
}
