import { Injectable, NotFoundException } from '@nestjs/common';

import { CustomersRepository } from '../repositories/customers.repository';
import { CustomerResponse } from '../responses/customer.response';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CUSTOMER_MESSAGES } from '../constants/customer.constants';

@Injectable()
export class CustomersService {
    constructor(private readonly customersRepository: CustomersRepository) {}

    findAll(userId: number) {
        return this.customersRepository.findAll(userId);
    }

    async findById(userId: number, id: number): Promise<CustomerResponse> {
        const customer = await this.customersRepository.findById(userId, id);

        if (!customer) {
            throw new NotFoundException(CUSTOMER_MESSAGES.NOT_FOUND);
        }

        return customer;
    }

    create(userId: number, dto: CreateCustomerDto) {
        return this.customersRepository.create(userId, dto);
    }

    async update(
        userId: number,
        id: number,
        dto: UpdateCustomerDto,
    ): Promise<CustomerResponse> {
        await this.findById(userId, id);

        return this.customersRepository.update(id, dto);
    }

    async delete(userId: number, id: number): Promise<void> {
        await this.findById(userId, id);

        await this.customersRepository.delete(id);
    }
}
