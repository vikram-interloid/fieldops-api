import { CustomerResponse } from 'src/modules/customers/responses/customer.response';
import { WorkOrderResponse } from 'src/modules/work-orders/responses/work-order.response';

export class ServiceCaseResponse {
  id: string;
  caseNo?: string;
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
  customer?: Partial<CustomerResponse> | null;
  workOrder?: Partial<WorkOrderResponse> | null;
  attachments?: any[];
  events?: any[];
}
