import {
  IsIn,
  IsInt,
  IsNotEmpty,
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

export class CreatePartDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  sku: string;

  @IsString()
  @IsIn(CATEGORIES)
  category: string;

  @IsString()
  @IsIn(LOCATIONS)
  location: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsInt()
  @Min(0)
  reorderLevel: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  supplier?: string;
}
