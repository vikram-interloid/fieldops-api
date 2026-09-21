export class LocationResponse {
  id: string;
  organizationId: string;
  customerId?: string | null;
  type: string;
  name: string;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: { name: string } | null;
}
