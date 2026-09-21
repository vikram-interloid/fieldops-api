import {
  CustomerResponse,
  CustomerLocationResponse,
  CustomerDeliveryPointResponse,
} from 'src/modules/customers/responses/customer.response';
import { WorkOrderResponse } from 'src/modules/work-orders/responses/work-order.response';

export class AssetResponse {
  id: string;
  name: string;
  serial: string;
  customerId?: string | null;
  health: number;
  warranty: string;
  status: string;
  category?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  location?: string | null;
  purchaseDate?: string | null;
  lastServiceDate?: string | null;
  nextServiceDate?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  photoKey?: string | null;
  locationId?: string | null;
  deliveryPointId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: Partial<CustomerResponse> | null;
  site?: Partial<CustomerLocationResponse> | null;
  deliveryPoint?: Partial<CustomerDeliveryPointResponse> | null;
  workOrders?: Partial<WorkOrderResponse>[];
  attachments?: any[];
}
