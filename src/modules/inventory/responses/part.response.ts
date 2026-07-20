export class PartResponse {
    id: string;
    name: string;
    sku: string;
    category: string;
    location: string;
    quantity: number;
    reorderLevel: number;
    unitPrice: number;
    supplier?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
