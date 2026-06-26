export class UserResponse {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    isActive: boolean;
}