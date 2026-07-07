import { Injectable } from '@nestjs/common';

import { LocationsRepository } from '../repositories/locations.repository';

@Injectable()
export class LocationsService {
    constructor(private readonly locationsRepository: LocationsRepository) {}

    findAll(userId: number) {
        return this.locationsRepository.findAll(userId);
    }
}
