import { Injectable, NotFoundException } from '@nestjs/common';

import { CloudFrontSignerService } from 'src/core/storage/services/cloudfront-signer.service';
import { AssetsRepository } from '../repositories/assets.repository';
import { AssetResponse } from '../responses/asset.response';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { ASSET_MESSAGES } from '../constants/asset.constants';

@Injectable()
export class AssetsService {
  constructor(
    private readonly assetsRepository: AssetsRepository,
    private readonly cloudFrontSigner: CloudFrontSignerService,
  ) {}

  private signAsset<
    T extends {
      photoKey?: string | null;
      photoUrl?: string | null;
      attachments?: any[];
    },
  >(asset: T): T {
    const rawPhoto = asset.photoKey || asset.photoUrl;
    const photoUrl = rawPhoto
      ? rawPhoto.startsWith('data:')
        ? rawPhoto
        : this.cloudFrontSigner.getSignedUrl(rawPhoto)
      : null;

    const attachments = asset.attachments
      ? this.cloudFrontSigner.signAttachments(asset.attachments)
      : undefined;

    return {
      ...asset,
      photoUrl,
      ...(attachments ? { attachments } : {}),
    };
  }

  async findAll(userId: string, includes?: string[]) {
    const assets = await this.assetsRepository.findAll(userId, includes);
    return assets.map((a) => this.signAsset(a));
  }

  async findById(
    userId: string,
    id: string,
    includes?: string[],
  ): Promise<AssetResponse> {
    const asset = await this.assetsRepository.findById(userId, id, includes);

    if (!asset) {
      throw new NotFoundException(ASSET_MESSAGES.NOT_FOUND);
    }

    return this.signAsset(asset as any);
  }

  async create(userId: string, dto: CreateAssetDto) {
    const asset = await this.assetsRepository.create(userId, dto);
    return this.signAsset(asset);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAssetDto,
  ): Promise<AssetResponse> {
    await this.findById(userId, id);

    const asset = await this.assetsRepository.update(id, dto);
    return this.signAsset(asset);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.findById(userId, id);

    await this.assetsRepository.delete(id);
  }
}
