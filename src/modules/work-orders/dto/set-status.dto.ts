import { IsIn, IsString } from 'class-validator';

const STATUSES = ['Open', 'In Progress', 'Overdue', 'Completed'];

export class SetStatusDto {
  @IsString()
  @IsIn(STATUSES)
  status: string;
}
