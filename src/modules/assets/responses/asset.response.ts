export class AssetResponse {
    id: number;
    name: string;
    serial: string;
    customerId?: number | null;
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
    locationId?: number | null;
    deliveryPointId?: number | null;
    createdAt: Date;
    updatedAt: Date;
    customer?: { name: string } | null;
    site?: { name: string } | null;
    deliveryPoint?: { name: string } | null;
}
