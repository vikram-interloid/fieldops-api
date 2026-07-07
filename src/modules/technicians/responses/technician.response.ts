export class TechnicianResponse {
    id: number;
    name: string;
    role: string;
    status: string;
    activeJobs: number;
    rating: number;
    skills: string[];
    email?: string | null;
    phone?: string | null;
    employeeId?: string | null;
    region?: string | null;
    department?: string | null;
    hireDate?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
