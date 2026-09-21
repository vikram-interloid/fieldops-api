import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const STATUSES = ['Active', 'Prospect', 'Inactive'];
const CONTRACT_TYPES = ['Standard', 'Premium', 'Enterprise'];
const INDUSTRIES = [
  'Food & Beverage',
  'Manufacturing',
  'Retail',
  'Logistics',
  'Technology',
  'Healthcare',
];

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  contactName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @IsString()
  @IsIn(INDUSTRIES)
  industry: string;

  @IsString()
  @IsIn(CONTRACT_TYPES)
  contractType: string;

  @IsString()
  @IsIn(STATUSES)
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
