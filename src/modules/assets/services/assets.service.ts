import { Injectable, NotFoundException } from '@nestjs/common';

import { AssetsRepository } from '../repositories/assets.repository';
import { AssetResponse } from '../responses/asset.response';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { ASSET_MESSAGES } from '../constants/asset.constants';

@Injectable()
export class AssetsService {
    constructor(
        private readonly assetsRepository: AssetsRepository,
    ) {}

    findAll(userId: string) {
        return this.assetsRepository.findAll(userId);
    }

    async findById(userId: string, id: string): Promise<AssetResponse> {
        const asset = await this.assetsRepository.findById(
            userId,
            id,
        );

        if (!asset) {
            throw new NotFoundException(ASSET_MESSAGES.NOT_FOUND);
        }

        return asset;
    }

    create(userId: string, dto: CreateAssetDto) {
        return this.assetsRepository.create(userId, dto);
    }

    async update(
        userId: string,
        id: string,
        dto: UpdateAssetDto,
    ): Promise<AssetResponse> {
        await this.findById(userId, id);

        return this.assetsRepository.update(id, dto);
    }

    async delete(userId: string, id: string): Promise<void> {
        await this.findById(userId, id);

        await this.assetsRepository.delete(id);
    }
}
