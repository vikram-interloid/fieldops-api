export class WorkOrderResponse {
    id: number;
    customerId?: number | null;
    technicianId?: number | null;
    assetId?: number | null;
    priority: string;
    status: string;
    serviceType?: string | null;
    location?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    due: string;
    scheduledDate?: string | null;
    estimatedHours?: number | null;
    description?: string | null;
    accepted: boolean;
    lat?: number | null;
    lng?: number | null;
    createdAt: Date;
    updatedAt: Date;
    customer?: { name: string } | null;
    technician?: { name: string } | null;
    asset?: { name: string } | null;
}
