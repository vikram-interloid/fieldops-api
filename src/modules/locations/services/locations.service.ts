import { Injectable, NotFoundException } from '@nestjs/common';

import { LocationsRepository } from '../repositories/locations.repository';
import { LocationResponse } from '../responses/location.response';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { LOCATION_MESSAGES } from '../constants/location.constants';

@Injectable()
export class LocationsService {
  constructor(private readonly locationsRepository: LocationsRepository) {}

  findAll(userId: string) {
    return this.locationsRepository.findAll(userId);
  }

  async findById(userId: string, id: string): Promise<LocationResponse> {
    const location = await this.locationsRepository.findById(userId, id);

    if (!location) {
      throw new NotFoundException(LOCATION_MESSAGES.NOT_FOUND);
    }

    return location;
  }

  create(userId: string, dto: CreateLocationDto): Promise<LocationResponse> {
    return this.locationsRepository.create(userId, dto);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateLocationDto,
  ): Promise<LocationResponse> {
    const existing = await this.findById(userId, id);

    return this.locationsRepository.update(id, dto, existing.organizationId);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.findById(userId, id);

    await this.locationsRepository.delete(id);
  }
}
