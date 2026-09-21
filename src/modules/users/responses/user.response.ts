export class UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  avatarKey?: string | null;
  isActive: boolean;
  isOrgAdmin?: boolean;
  role?: string | null;
}
