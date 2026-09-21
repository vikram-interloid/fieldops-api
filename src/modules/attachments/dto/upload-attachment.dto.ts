import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export const ATTACHMENT_ENTITY_TYPES = [
  'case',
  'work_order',
  'asset',
  'user',
] as const;

export type AttachmentEntityType = (typeof ATTACHMENT_ENTITY_TYPES)[number];

export class UploadAttachmentDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(ATTACHMENT_ENTITY_TYPES)
  entityType: AttachmentEntityType;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsString()
  type?: string;
}
