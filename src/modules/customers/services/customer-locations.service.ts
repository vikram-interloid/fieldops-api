import { Injectable, NotFoundException } from '@nestjs/common';

import { CustomerLocationsRepository } from '../repositories/customer-locations.repository';
import { CustomerLocationResponse } from '../responses/customer.response';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { CreateDeliveryPointDto } from '../dto/create-delivery-point.dto';
import { CUSTOMER_MESSAGES } from '../constants/customer.constants';

@Injectable()
export class CustomerLocationsService {
    constructor(
        private readonly customerLocationsRepository: CustomerLocationsRepository,
    ) {}

    async createLocation(
        userId: string,
        customerId: string,
        dto: CreateLocationDto,
    ): Promise<CustomerLocationResponse> {
        // Ensure the parent customer is within the user's organization.
        const customer =
            await this.customerLocationsRepository.findCustomerInOrg(
                userId,
                customerId,
            );

        if (!customer) {
            throw new NotFoundException(CUSTOMER_MESSAGES.NOT_FOUND);
        }

        return this.customerLocationsRepository.createLocation(
            customerId,
            dto,
        );
    }

    async updateLocation(
        userId: string,
        id: string,
        dto: UpdateLocationDto,
    ): Promise<CustomerLocationResponse> {
        await this.ensureLocationInOrg(userId, id);

        return this.customerLocationsRepository.updateLocation(id, dto);
    }

    async deleteLocation(userId: string, id: string): Promise<void> {
        await this.ensureLocationInOrg(userId, id);

        await this.customerLocationsRepository.deleteLocation(id);
    }

    async createDeliveryPoint(
        userId: string,
        locationId: string,
        dto: CreateDeliveryPointDto,
    ) {
        await this.ensureLocationInOrg(userId, locationId);

        return this.customerLocationsRepository.createDeliveryPoint(
            locationId,
            dto,
        );
    }

    async deleteDeliveryPoint(userId: string, id: string): Promise<void> {
        const deliveryPoint =
            await this.customerLocationsRepository.findDeliveryPointInOrg(
                userId,
                id,
            );

        if (!deliveryPoint) {
            throw new NotFoundException(
                CUSTOMER_MESSAGES.DELIVERY_POINT_NOT_FOUND,
            );
        }

        await this.customerLocationsRepository.deleteDeliveryPoint(id);
    }

    private async ensureLocationInOrg(
        userId: string,
        locationId: string,
    ): Promise<void> {
        const location =
            await this.customerLocationsRepository.findLocationInOrg(
                userId,
                locationId,
            );

        if (!location) {
            throw new NotFoundException(CUSTOMER_MESSAGES.LOCATION_NOT_FOUND);
        }
    }
}
