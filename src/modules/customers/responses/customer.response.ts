export class CustomerDeliveryPointResponse {
    id: number;
    locationId: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export class CustomerLocationResponse {
    id: number;
    customerId: number | null;
    name: string;
    address: string | null;
    city: string | null;
    deliveryPoints: CustomerDeliveryPointResponse[];
    createdAt: Date;
    updatedAt: Date;
}

export class CustomerResponse {
    id: number;
    name: string;
    contactName: string;
    email: string;
    phone: string;
    industry: string;
    contractType: string;
    status: string;
    city?: string | null;
    address?: string | null;
    locations?: CustomerLocationResponse[];
    createdAt: Date;
    updatedAt: Date;
}
