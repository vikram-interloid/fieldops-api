import { IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryAttachmentsDto {
  @IsOptional()
  @IsUUID()
  serviceCaseId?: string;

  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @IsOptional()
  @IsUUID()
  assetId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
