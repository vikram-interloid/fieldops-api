import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateDeliveryPointDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;
}
