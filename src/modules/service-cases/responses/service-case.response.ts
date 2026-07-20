export class ServiceCaseResponse {
    id: string;
    customerId?: string | null;
    subject: string;
    description: string;
    serviceType: string;
    priority: string;
    location: string;
    status: string;
    category?: string | null;
    preferredOperatorId?: string | null;
    interestedOperatorIds?: string[];
    assignedOperatorOrgId?: string | null;
    workOrderId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    customer?: { name: string } | null;
}
