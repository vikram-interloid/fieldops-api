import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

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

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @IsIn(INDUSTRIES)
  industry?: string;

  @IsOptional()
  @IsString()
  @IsIn(CONTRACT_TYPES)
  contractType?: string;

  @IsOptional()
  @IsString()
  @IsIn(STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
