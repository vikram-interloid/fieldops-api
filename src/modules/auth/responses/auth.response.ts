export class AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    roles: string[];
    customerName?: string | null;
    technicianName?: string | null;
    organizationName?: string | null;
    orgType?: string | null;
    isOrgAdmin?: boolean | null;
    verificationStatus?: string | null;
  };
}
