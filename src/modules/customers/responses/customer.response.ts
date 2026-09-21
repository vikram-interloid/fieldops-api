export class CustomerDeliveryPointResponse {
  id: string;
  locationId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerLocationResponse {
  id: string;
  customerId: string | null;
  name: string;
  address: string | null;
  city: string | null;
  deliveryPoints: CustomerDeliveryPointResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerResponse {
  id: string;
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
