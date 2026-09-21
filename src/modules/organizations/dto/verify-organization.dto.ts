import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyOrganizationDto {
  @IsIn(['verified', 'rejected', 'pending'])
  status: 'verified' | 'rejected' | 'pending';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
