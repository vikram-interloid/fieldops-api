export class AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
}