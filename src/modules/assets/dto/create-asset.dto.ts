import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

const STATUSES = ['Operational', 'Maintenance', 'Out of Service'];
const WARRANTIES = ['Active', 'Expiring Soon', 'Expired'];
const CATEGORIES = [
    'HVAC',
    'Compressor',
    'Pump',
    'Generator',
    'Electrical',
    'Other',
];

export class CreateAssetDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    serial: string;

    @IsInt()
    @Min(0)
    @Max(100)
    health: number;

    @IsString()
    @IsIn(WARRANTIES)
    warranty: string;

    @IsString()
    @IsIn(STATUSES)
    status: string;

    @IsOptional()
    @IsInt()
    customerId?: string;

    @IsOptional()
    @IsString()
    @IsIn(CATEGORIES)
    category?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    manufacturer?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    model?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    location?: string;

    @IsOptional()
    @IsString()
    @MaxLength(40)
    purchaseDate?: string;

    @IsOptional()
    @IsString()
    @MaxLength(40)
    lastServiceDate?: string;

    @IsOptional()
    @IsString()
    @MaxLength(40)
    nextServiceDate?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    // Photo of the equipment — an absolute URL or an app-local path.
    @IsOptional()
    @IsString()
    @MaxLength(500)
    photoUrl?: string;

    @IsOptional()
    @IsInt()
    locationId?: string;

    @IsOptional()
    @IsInt()
    deliveryPointId?: string;
}
