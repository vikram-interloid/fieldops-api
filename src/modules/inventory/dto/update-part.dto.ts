import {
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

const CATEGORIES = [
    'Filters',
    'Compressors',
    'Electrical',
    'Pumps',
    'Refrigerant',
    'Tools',
    'Hardware',
];

const LOCATIONS = [
    'Warehouse A',
    'Warehouse B',
    'Van 1',
    'Van 2',
    'Central Store',
];

export class UpdatePartDto {
    @IsOptional()
    @IsString()
    @MaxLength(150)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(80)
    sku?: string;

    @IsOptional()
    @IsString()
    @IsIn(CATEGORIES)
    category?: string;

    @IsOptional()
    @IsString()
    @IsIn(LOCATIONS)
    location?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    quantity?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    reorderLevel?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    unitPrice?: number;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    supplier?: string;
}
