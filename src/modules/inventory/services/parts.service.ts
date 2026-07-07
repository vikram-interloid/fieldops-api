import { Injectable, NotFoundException } from '@nestjs/common';

import { PartsRepository } from '../repositories/parts.repository';
import { PartResponse } from '../responses/part.response';
import { CreatePartDto } from '../dto/create-part.dto';
import { UpdatePartDto } from '../dto/update-part.dto';
import { AdjustQuantityDto } from '../dto/adjust-quantity.dto';
import { PART_MESSAGES } from '../constants/part.constants';

@Injectable()
export class PartsService {
    constructor(private readonly partsRepository: PartsRepository) {}

    findAll(userId: number) {
        return this.partsRepository.findAll(userId);
    }

    async findById(userId: number, id: number): Promise<PartResponse> {
        const part = await this.partsRepository.findById(userId, id);

        if (!part) {
            throw new NotFoundException(PART_MESSAGES.NOT_FOUND);
        }

        return part;
    }

    create(userId: number, dto: CreatePartDto) {
        return this.partsRepository.create(userId, dto);
    }

    async update(
        userId: number,
        id: number,
        dto: UpdatePartDto,
    ): Promise<PartResponse> {
        await this.findById(userId, id);

        return this.partsRepository.update(id, dto);
    }

    async adjustQuantity(
        userId: number,
        id: number,
        dto: AdjustQuantityDto,
    ): Promise<PartResponse> {
        const part = await this.findById(userId, id);

        const quantity = Math.max(0, part.quantity + dto.delta);

        return this.partsRepository.updateQuantity(id, quantity);
    }

    async delete(userId: number, id: number): Promise<void> {
        await this.findById(userId, id);

        await this.partsRepository.delete(id);
    }
}
