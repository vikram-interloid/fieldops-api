export class ServiceCaseResponse {
    id: number;
    customerId?: number | null;
    subject: string;
    description: string;
    serviceType: string;
    priority: string;
    location: string;
    status: string;
    workOrderId?: number | null;
    createdAt: Date;
    updatedAt: Date;
    customer?: { name: string } | null;
}
