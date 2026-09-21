import { Injectable, NotFoundException } from '@nestjs/common';

import {
  WorkOrdersRepository,
  type WorkOrderActor,
} from '../repositories/work-orders.repository';
import { WorkOrderResponse } from '../responses/work-order.response';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';
import { SetStatusDto } from '../dto/set-status.dto';
import { AssignDto } from '../dto/assign.dto';
import { WORK_ORDER_MESSAGES } from '../constants/work-order.constants';
import { CloudFrontSignerService } from 'src/core/storage/services/cloudfront-signer.service';

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly workOrdersRepository: WorkOrdersRepository,
    private readonly cloudFrontSigner: CloudFrontSignerService,
  ) {}

  private signWorkOrder<T extends { attachments?: any[]; asset?: any }>(wo: T): T {
    let res = wo;
    if (wo.attachments?.length) {
      res = {
        ...res,
        attachments: this.cloudFrontSigner.signAttachments(wo.attachments),
      };
    }
    if (res.asset?.photoKey || res.asset?.photoUrl) {
      const raw = res.asset.photoKey || res.asset.photoUrl;
      const signed = raw.startsWith('data:')
        ? raw
        : this.cloudFrontSigner.getSignedUrl(raw);
      res = {
        ...res,
        asset: {
          ...res.asset,
          photoUrl: signed,
        },
      };
    }
    return res;
  }

  async findAll(userId: string, includes?: string[]) {
    const orders = await this.workOrdersRepository.findAll(userId, includes);
    return orders.map((wo) => this.signWorkOrder(wo));
  }

  async findById(
    userId: string,
    id: string,
    includes?: string[],
  ): Promise<WorkOrderResponse> {
    const workOrder = await this.workOrdersRepository.findById(userId, id, includes);

    if (!workOrder) {
      throw new NotFoundException(WORK_ORDER_MESSAGES.NOT_FOUND);
    }

    return this.signWorkOrder(workOrder as any);
  }

  async findDetail(userId: string, id: string) {
    const detail = await this.workOrdersRepository.findDetail(userId, id);

    if (!detail) {
      throw new NotFoundException(WORK_ORDER_MESSAGES.NOT_FOUND);
    }

    return this.signWorkOrder(detail);
  }

  create(userId: string, dto: CreateWorkOrderDto, actor?: WorkOrderActor) {
    return this.workOrdersRepository.create(userId, dto, actor);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateWorkOrderDto,
    actor?: WorkOrderActor,
  ): Promise<WorkOrderResponse> {
    await this.findById(userId, id);

    return this.workOrdersRepository.update(id, dto, actor);
  }

  async setStatus(
    userId: string,
    id: string,
    dto: SetStatusDto,
    actor?: WorkOrderActor,
  ): Promise<WorkOrderResponse> {
    await this.findById(userId, id);

    return this.workOrdersRepository.setStatus(id, dto.status, actor);
  }

  async assign(
    userId: string,
    id: string,
    dto: AssignDto,
    actor?: WorkOrderActor,
  ): Promise<WorkOrderResponse> {
    await this.findById(userId, id);

    return this.workOrdersRepository.assign(id, dto.technicianId, actor);
  }

  async accept(
    userId: string,
    id: string,
    actor?: WorkOrderActor,
  ): Promise<WorkOrderResponse> {
    await this.findById(userId, id);

    return this.workOrdersRepository.accept(id, actor);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.findById(userId, id);

    await this.workOrdersRepository.delete(id);
  }
}
