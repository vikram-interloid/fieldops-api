import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Payload for a tenant admin adding a user to their own organization. */
export class CreateOrgUserDto {
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  // Optional role override; when omitted the service picks a sensible default
  // for the caller's org kind (Customer for customer orgs, Technician for
  // operator orgs).
  @IsOptional()
  @IsIn(['Admin', 'Manager', 'Dispatcher', 'Technician', 'Customer'])
  role?: string;

  @IsOptional()
  isOrgAdmin?: boolean;
}
