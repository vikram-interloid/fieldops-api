import {
    ArrayNotEmpty,
    IsArray,
    IsIn,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

import { SERVICE_CATEGORIES } from '../constants/operator.constants';

export class UpdateOperatorDto {
    @IsOptional()
    @IsString()
    @MaxLength(150)
    name?: string;

    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsIn(SERVICE_CATEGORIES as unknown as string[], { each: true })
    categories?: string[];

    @IsOptional()
    @IsString()
    @MaxLength(30)
    status?: string;

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
    @MaxLength(80)
    region?: string;
}
