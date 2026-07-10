export class ServiceCaseResponse {
    id: number;
    customerId?: number | null;
    subject: string;
    description: string;
    serviceType: string;
    priority: string;
    location: string;
    status: string;
    category?: string | null;
    preferredOperatorId?: number | null;
    interestedOperatorIds?: number[];
    assignedOperatorOrgId?: number | null;
    workOrderId?: number | null;
    createdAt: Date;
    updatedAt: Date;
    customer?: { name: string } | null;
}
