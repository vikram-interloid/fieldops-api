import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({
    adapter,
})

async function main() {
    const roles = [
        'Admin',
        'Customer',
        'Technician',
        'Dispatcher',
        'Manager',
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: {
                name: role,
            },

            update: {},

            create: {
                name: role,
            },
        });
    }

    console.log('Roles seeded successfully');
}

main()
    .catch((error => {
        console.log(error);
    }))
    .finally(async () => {
        await prisma.$disconnect();
    });