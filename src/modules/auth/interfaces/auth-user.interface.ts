export interface AuthUser {
    userId: string;
    email: string;
    roles: string[];
    tokenVersion: number;
}