import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsIn,
    IsInt,
    Min,
    ValidateNested,
} from 'class-validator';

import { SLA_PRIORITIES } from '../constants/sla.constants';

export class SlaPolicyItemDto {
    @IsIn(SLA_PRIORITIES as unknown as string[])
    priority: string;

    @IsInt()
    @Min(1)
    responseMinutes: number;

    @IsInt()
    @Min(1)
    resolutionMinutes: number;
}

export class UpdatePoliciesDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => SlaPolicyItemDto)
    policies: SlaPolicyItemDto[];
}
