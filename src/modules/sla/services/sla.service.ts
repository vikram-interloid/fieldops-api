import { Injectable, NotFoundException } from '@nestjs/common';

import { SlaRepository } from '../repositories/sla.repository';
import { UpdatePoliciesDto } from '../dto/update-policies.dto';
import {
  AT_RISK_THRESHOLD,
  DEFAULT_SLA_POLICIES,
  SLA_PRIORITIES,
} from '../constants/sla.constants';

type PolicyMap = Record<
  string,
  { responseMinutes: number; resolutionMinutes: number }
>;

type WorkOrderSla = {
  id: string;
  priority: string;
  status: string;
  createdAt: Date;
  respondedAt: Date | null;
  resolvedAt: Date | null;
  slaPausedAt: Date | null;
  slaPausedMs: number;
};

type SlaState = 'met' | 'on_track' | 'at_risk' | 'breached' | 'paused';

@Injectable()
export class SlaService {
  constructor(private readonly slaRepository: SlaRepository) {}

  /** Returns the org's policies, backfilling defaults for any missing priority. */
  async getPolicies(userId: string) {
    const organizationId =
      await this.slaRepository.resolveOrganizationId(userId);
    const existing = await this.slaRepository.findPolicies(organizationId);
    const byPriority = new Map(existing.map((p) => [p.priority, p]));

    return SLA_PRIORITIES.map((priority) => {
      const found = byPriority.get(priority);
      const fallback = DEFAULT_SLA_POLICIES[priority];
      return {
        priority,
        responseMinutes: found?.responseMinutes ?? fallback.responseMinutes,
        resolutionMinutes:
          found?.resolutionMinutes ?? fallback.resolutionMinutes,
      };
    });
  }

  async updatePolicies(userId: string, dto: UpdatePoliciesDto) {
    const organizationId =
      await this.slaRepository.resolveOrganizationId(userId);
    for (const p of dto.policies) {
      await this.slaRepository.upsertPolicy(
        organizationId,
        p.priority,
        p.responseMinutes,
        p.resolutionMinutes,
      );
    }
    return this.getPolicies(userId);
  }

  private policyMap(
    policies: {
      priority: string;
      responseMinutes: number;
      resolutionMinutes: number;
    }[],
  ): PolicyMap {
    return Object.fromEntries(
      policies.map((p) => [
        p.priority,
        {
          responseMinutes: p.responseMinutes,
          resolutionMinutes: p.resolutionMinutes,
        },
      ]),
    );
  }

  /** Paused-adjusted elapsed ms between createdAt and a moment (or now). */
  private elapsedMs(wo: WorkOrderSla, until: Date, now: Date): number {
    const pausedNow =
      wo.slaPausedAt && !wo.resolvedAt
        ? now.getTime() - wo.slaPausedAt.getTime()
        : 0;
    return (
      until.getTime() - wo.createdAt.getTime() - wo.slaPausedMs - pausedNow
    );
  }

  private stageState(
    wo: WorkOrderSla,
    completedAt: Date | null,
    targetMinutes: number,
    now: Date,
  ): SlaState {
    const targetMs = targetMinutes * 60_000;
    if (completedAt) {
      const spent = this.elapsedMs(wo, completedAt, now);
      return spent <= targetMs ? 'met' : 'breached';
    }
    if (wo.slaPausedAt) return 'paused';
    const spent = this.elapsedMs(wo, now, now);
    const remaining = targetMs - spent;
    if (remaining <= 0) return 'breached';
    if (remaining <= targetMs * AT_RISK_THRESHOLD) return 'at_risk';
    return 'on_track';
  }

  async getSummary(userId: string) {
    const organizationId =
      await this.slaRepository.resolveOrganizationId(userId);
    const policies = await this.getPolicies(userId);
    const map = this.policyMap(policies);
    const workOrders =
      await this.slaRepository.findWorkOrdersForSla(organizationId);
    const now = new Date();

    const counts = {
      met: 0,
      onTrack: 0,
      atRisk: 0,
      breached: 0,
      paused: 0,
    };
    const byPriority: Record<
      string,
      { met: number; breached: number; total: number }
    > = {};

    for (const wo of workOrders as WorkOrderSla[]) {
      const policy = map[wo.priority];
      if (!policy) continue;
      const state = this.stageState(
        wo,
        wo.resolvedAt,
        policy.resolutionMinutes,
        now,
      );
      if (state === 'met') counts.met++;
      else if (state === 'on_track') counts.onTrack++;
      else if (state === 'at_risk') counts.atRisk++;
      else if (state === 'breached') counts.breached++;
      else if (state === 'paused') counts.paused++;

      byPriority[wo.priority] ??= { met: 0, breached: 0, total: 0 };
      byPriority[wo.priority].total++;
      if (state === 'met') byPriority[wo.priority].met++;
      if (state === 'breached') byPriority[wo.priority].breached++;
    }

    const decided = counts.met + counts.breached;
    const compliance =
      decided === 0 ? 100 : Math.round((counts.met / decided) * 100);

    return {
      total: workOrders.length,
      compliance,
      counts,
      byPriority: SLA_PRIORITIES.map((priority) => ({
        priority,
        ...(byPriority[priority] ?? { met: 0, breached: 0, total: 0 }),
      })),
    };
  }

  // ----- per-work-order actions ------------------------------------------

  private async requireWorkOrder(userId: string, id: string) {
    const organizationId =
      await this.slaRepository.resolveOrganizationId(userId);
    const wo = await this.slaRepository.findWorkOrderInOrg(organizationId, id);
    if (!wo) throw new NotFoundException('Work order not found');
    return wo;
  }

  async respond(userId: string, id: string) {
    const wo = await this.requireWorkOrder(userId, id);
    if (wo.respondedAt) return wo;
    return this.slaRepository.updateWorkOrderSla(id, {
      respondedAt: new Date(),
      status: 'In Progress',
    });
  }

  async resolve(userId: string, id: string) {
    const wo = await this.requireWorkOrder(userId, id);
    // Closing while paused: fold the open pause into accumulated paused time.
    const extra = wo.slaPausedAt ? Date.now() - wo.slaPausedAt.getTime() : 0;
    return this.slaRepository.updateWorkOrderSla(id, {
      resolvedAt: new Date(),
      slaPausedAt: null,
      slaPausedMs: wo.slaPausedMs + extra,
      status: 'Completed',
    });
  }

  async pause(userId: string, id: string) {
    const wo = await this.requireWorkOrder(userId, id);
    if (wo.slaPausedAt || wo.resolvedAt) return wo;
    return this.slaRepository.updateWorkOrderSla(id, {
      slaPausedAt: new Date(),
    });
  }

  async resume(userId: string, id: string) {
    const wo = await this.requireWorkOrder(userId, id);
    if (!wo.slaPausedAt) return wo;
    const extra = Date.now() - wo.slaPausedAt.getTime();
    return this.slaRepository.updateWorkOrderSla(id, {
      slaPausedAt: null,
      slaPausedMs: wo.slaPausedMs + extra,
    });
  }
}
