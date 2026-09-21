import { IsOptional, IsString } from 'class-validator';

export class QueryTableViewsDto {
  @IsOptional()
  @IsString()
  tableKey?: string;
}
