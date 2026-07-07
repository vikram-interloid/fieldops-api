import { IsIn, IsString } from 'class-validator';

const STATUSES = ['New', 'In Review', 'Converted', 'Rejected'];

export class SetStatusDto {
    @IsString()
    @IsIn(STATUSES)
    status: string;
}
