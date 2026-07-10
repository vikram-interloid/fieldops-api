import { IsInt } from 'class-validator';

/** Payload for a platform dispatcher assigning an operator org to a case. */
export class AssignOperatorDto {
    @IsInt()
    operatorOrgId: number;
}
