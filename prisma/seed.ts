import 'dotenv/config';

import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const ROLE_NAMES = ['Admin', 'Customer', 'Technician', 'Dispatcher', 'Manager'];

const DEMO_PASSWORD = 'Password123!';

const DEMO_USERS = [
    { firstName: 'Vikram', lastName: 'Admin', email: 'vikram.new.dev@gmail.com', role: 'Admin' },
    { firstName: 'Maya', lastName: 'Manager', email: 'manager@fieldops.dev', role: 'Manager' },
    { firstName: 'Dev', lastName: 'Dispatcher', email: 'dispatcher@fieldops.dev', role: 'Dispatcher' },
    { firstName: 'Tara', lastName: 'Technician', email: 'tech@fieldops.dev', role: 'Technician' },
    { firstName: 'Cara', lastName: 'Customer', email: 'customer@fieldops.dev', role: 'Customer' },
];

async function seedRoles() {
    for (const name of ROLE_NAMES) {
        await prisma.role.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
}

async function seedOrganization() {
    // The platform org ("FieldOps"): the control-plane tenant whose staff
    // (admin/manager/dispatcher/technician) manage every customer, operator,
    // technician, case, and work order. Distinct from a self-registered
    // operator org so platform admins keep full visibility (e.g. Operators).
    const data = {
        name: 'FieldOps',
        industry: 'Field Service Management',
        type: 'platform',
        categories: ['hvac', 'refrigeration', 'electrical', 'general'],
        region: 'National',
        verificationStatus: 'verified',
        verifiedAt: new Date(),
    };

    const existing = await prisma.organization.findFirst({
        where: { name: { in: ['FieldOps', 'Acme Field Services'] } },
    });
    if (existing) {
        // Keep older demo data working: promote it to the operator profile.
        return prisma.organization.update({
            where: { id: existing.id },
            data,
        });
    }

    return prisma.organization.create({ data });
}

async function seedUsers(organizationId: number) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const roles = await prisma.role.findMany();
    const roleByName = new Map(roles.map((r) => [r.name, r.id]));

    for (const u of DEMO_USERS) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                passwordHash,
                organizationId,
            },
        });

        const roleId = roleByName.get(u.role);
        if (roleId) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: user.id, roleId } },
                update: {},
                create: { userId: user.id, roleId },
            });
        }
    }
}

async function seedDomain(organizationId: number) {
    // Idempotency guard: only seed domain data once per organization.
    const customerCount = await prisma.customer.count({ where: { organizationId } });
    if (customerCount > 0) {
        console.log('Domain data already present — skipping.');
        return;
    }

    // --- Customers + locations + delivery points -------------------------
    const customerSeed = [
        {
            name: 'Pepsi', contactName: 'Anita Desai', email: 'anita@pepsi.com', phone: '+91 98111 20001',
            industry: 'Food & Beverage', contractType: 'Enterprise', status: 'Active', city: 'Mumbai',
            locations: [
                { name: 'Andheri Bottling Plant', address: '12 MIDC Industrial Area', city: 'Mumbai', points: ['Loading Dock A', 'Cold Storage', 'Rooftop Plant Room'] },
                { name: 'Pune Warehouse', address: '88 Hinjewadi Phase 2', city: 'Pune', points: ['Bay 1', 'Bay 2'] },
            ],
        },
        {
            name: 'Nestle', contactName: 'Rohan Mehta', email: 'rohan@nestle.com', phone: '+91 98111 20002',
            industry: 'Food & Beverage', contractType: 'Premium', status: 'Active', city: 'Gurgaon',
            locations: [
                { name: 'Gurgaon Distribution Center', address: '45 Udyog Vihar', city: 'Gurgaon', points: ['Warehouse 3', 'Chiller Unit'] },
            ],
        },
        {
            name: 'Coca-Cola', contactName: 'Priya Nair', email: 'priya@coca-cola.com', phone: '+91 98111 20003',
            industry: 'Food & Beverage', contractType: 'Enterprise', status: 'Active', city: 'Bengaluru',
            locations: [
                { name: 'Whitefield Bottling Line', address: '21 ITPL Main Road', city: 'Bengaluru', points: ['Bottling Line 2', 'Compressor Room'] },
            ],
        },
        {
            name: 'Infosys', contactName: 'Karthik Rao', email: 'karthik@infosys.com', phone: '+91 98111 20004',
            industry: 'Technology', contractType: 'Premium', status: 'Active', city: 'Pune',
            locations: [
                { name: 'Pune Office Campus', address: '7 Magarpatta City', city: 'Pune', points: ['Office Block B', 'Server Room'] },
            ],
        },
        {
            name: 'Amazon', contactName: 'Sneha Iyer', email: 'sneha@amazon.com', phone: '+91 98111 20005',
            industry: 'Logistics', contractType: 'Enterprise', status: 'Active', city: 'Hyderabad',
            locations: [
                { name: 'Fulfillment Center HYD-1', address: '3 Outer Ring Road', city: 'Hyderabad', points: ['Inbound Dock', 'Pump House'] },
            ],
        },
        {
            name: 'Toyota', contactName: 'Sameer Patel', email: 'sameer@toyota.com', phone: '+91 98111 20006',
            industry: 'Manufacturing', contractType: 'Standard', status: 'Active', city: 'Chennai',
            locations: [
                { name: 'Chennai Assembly Plant', address: '9 Oragadam SIPCOT', city: 'Chennai', points: ['Paint Shop', 'Weld Line', 'Canteen HVAC'] },
            ],
        },
        {
            name: 'IKEA', contactName: 'Pooja Reddy', email: 'pooja@ikea.com', phone: '+91 98111 20007',
            industry: 'Retail', contractType: 'Standard', status: 'Active', city: 'Mumbai',
            locations: [
                { name: 'Navi Mumbai Store', address: '4 Turbhe MIDC', city: 'Navi Mumbai', points: ['Food Court', 'Cold Room', 'Rooftop AHU'] },
            ],
        },
        {
            name: 'Bosch', contactName: 'Arjun Pillai', email: 'arjun@bosch.com', phone: '+91 98111 20008',
            industry: 'Technology', contractType: 'Premium', status: 'Active', city: 'Bengaluru',
            locations: [
                { name: 'Adugodi R&D Campus', address: '18 Hosur Road', city: 'Bengaluru', points: ['Lab Chiller Room', 'Data Center'] },
            ],
        },
        {
            name: 'Starbucks', contactName: 'Meera Krishnan', email: 'meera@starbucks.com', phone: '+91 98111 20009',
            industry: 'Food & Beverage', contractType: 'Premium', status: 'Active', city: 'Bengaluru',
            locations: [
                { name: 'Koramangala Roastery', address: '80 Feet Road', city: 'Bengaluru', points: ['Brew Bar', 'Cold Storage'] },
                { name: 'Indiranagar Cafe', address: '100 Feet Road', city: 'Bengaluru', points: ['Espresso Station'] },
            ],
        },
        {
            name: 'Reliance Retail', contactName: 'Vikas Kulkarni', email: 'vikas@relianceretail.com', phone: '+91 98111 20010',
            industry: 'Retail', contractType: 'Enterprise', status: 'Active', city: 'Ahmedabad',
            locations: [
                { name: 'Ahmedabad Hypermart', address: '55 SG Highway', city: 'Ahmedabad', points: ['Frozen Aisle', 'Dairy Chiller', 'Backroom AHU'] },
            ],
        },
    ];

    const customerByName = new Map<string, number>();
    // location name -> id, delivery point name -> id (names are unique enough in this seed)
    const locationByName = new Map<string, number>();
    const pointByName = new Map<string, number>();

    for (const c of customerSeed) {
        const { locations, ...scalar } = c;
        const customer = await prisma.customer.create({
            data: { ...scalar, organizationId },
        });
        customerByName.set(customer.name, customer.id);

        for (const loc of locations) {
            const location = await prisma.location.create({
                data: {
                    organizationId,
                    customerId: customer.id,
                    type: 'customer_site',
                    name: loc.name,
                    address: loc.address,
                    city: loc.city,
                },
            });
            locationByName.set(location.name, location.id);

            for (const pointName of loc.points) {
                const point = await prisma.deliveryPoint.create({
                    data: { locationId: location.id, name: pointName },
                });
                pointByName.set(`${location.name}:${pointName}`, point.id);
            }
        }
    }

    // --- Technicians -----------------------------------------------------
    const technicianSeed = [
        { name: 'Ravi Kumar', role: 'Senior HVAC Technician', status: 'Available', activeJobs: 2, rating: 4.8, skills: ['HVAC', 'Refrigeration'], email: 'ravi@acmefield.com', phone: '+91 90000 10001', region: 'West Zone', department: 'HVAC' },
        { name: 'Sunita Sharma', role: 'Electrical Engineer', status: 'On Job', activeJobs: 3, rating: 4.6, skills: ['Electrical', 'Diagnostics'], email: 'sunita@acmefield.com', phone: '+91 90000 10002', region: 'North Zone', department: 'Electrical' },
        { name: 'Amit Joshi', role: 'Field Technician', status: 'Available', activeJobs: 1, rating: 4.4, skills: ['Mechanical', 'Pumps'], email: 'amit@acmefield.com', phone: '+91 90000 10003', region: 'South Zone', department: 'Mechanical' },
        { name: 'Neha Gupta', role: 'Plumbing Specialist', status: 'Off Duty', activeJobs: 0, rating: 4.2, skills: ['Plumbing'], email: 'neha@acmefield.com', phone: '+91 90000 10004', region: 'Central Zone', department: 'Plumbing' },
        { name: 'Vikram Singh', role: 'Refrigeration Technician', status: 'Available', activeJobs: 1, rating: 4.7, skills: ['Refrigeration', 'HVAC'], email: 'vikram@acmefield.com', phone: '+91 90000 10005', region: 'South Zone', department: 'Refrigeration' },
        { name: 'Priya Menon', role: 'Coffee Equipment Specialist', status: 'On Job', activeJobs: 2, rating: 4.9, skills: ['Coffee', 'Vending'], email: 'priya@acmefield.com', phone: '+91 90000 10006', region: 'South Zone', department: 'Appliances' },
        { name: 'Rahul Verma', role: 'Field Technician', status: 'Available', activeJobs: 0, rating: 4.3, skills: ['Mechanical', 'Electrical'], email: 'rahulv@acmefield.com', phone: '+91 90000 10007', region: 'West Zone', department: 'Mechanical' },
    ];
    const technicianByName = new Map<string, number>();
    for (const t of technicianSeed) {
        const tech = await prisma.technician.create({ data: { ...t, organizationId } });
        technicianByName.set(tech.name, tech.id);
    }

    // --- Parts -----------------------------------------------------------
    const partSeed = [
        { name: 'HEPA Filter 24x24', sku: 'FLT-2424', category: 'Filters', location: 'Warehouse A', quantity: 120, reorderLevel: 30, unitPrice: 18.5, supplier: 'FilterCo' },
        { name: 'Scroll Compressor 5T', sku: 'CMP-5T', category: 'Compressors', location: 'Warehouse B', quantity: 8, reorderLevel: 10, unitPrice: 640, supplier: 'CoolParts' },
        { name: 'Contactor 40A', sku: 'ELC-40A', category: 'Electrical', location: 'Van 1', quantity: 0, reorderLevel: 12, unitPrice: 22, supplier: 'ElectroSupply' },
        { name: 'Circulation Pump 1HP', sku: 'PMP-1HP', category: 'Pumps', location: 'Central Store', quantity: 25, reorderLevel: 8, unitPrice: 145, supplier: 'FlowTech' },
        { name: 'R-410A Refrigerant', sku: 'REF-410A', category: 'Refrigerant', location: 'Warehouse A', quantity: 40, reorderLevel: 15, unitPrice: 95 },
        { name: 'Espresso Group Head Gasket', sku: 'COF-GHG', category: 'Coffee Parts', location: 'Warehouse A', quantity: 60, reorderLevel: 20, unitPrice: 8, supplier: 'BrewParts' },
        { name: 'Vending Coil Motor', sku: 'VND-COIL', category: 'Vending Parts', location: 'Warehouse B', quantity: 14, reorderLevel: 10, unitPrice: 34, supplier: 'VendSupply' },
        { name: 'Condenser Fan Blade 18"', sku: 'HVAC-FAN18', category: 'HVAC', location: 'Warehouse B', quantity: 22, reorderLevel: 8, unitPrice: 41, supplier: 'CoolParts' },
        { name: 'Thermostat Digital', sku: 'ELC-THERM', category: 'Electrical', location: 'Van 2', quantity: 5, reorderLevel: 12, unitPrice: 28, supplier: 'ElectroSupply' },
        { name: 'Water Filter Cartridge', sku: 'FLT-WTR', category: 'Filters', location: 'Central Store', quantity: 90, reorderLevel: 25, unitPrice: 15, supplier: 'FilterCo' },
    ];
    for (const p of partSeed) {
        await prisma.part.create({ data: { ...p, organizationId } });
    }

    // --- Assets ----------------------------------------------------------
    const assetSeed = [
        { name: 'Carrier Chiller 30XA', serial: 'SN-48201', customer: 'Pepsi', health: 92, warranty: 'Active', status: 'Operational', category: 'HVAC', manufacturer: 'Carrier', model: '30XA-1002', location: 'Andheri Bottling Plant', locationName: 'Andheri Bottling Plant', pointName: 'Rooftop Plant Room', purchaseDate: '2023-01-10', lastServiceDate: '2026-05-02', nextServiceDate: '2026-08-02' },
        { name: 'Daikin Rooftop Unit', serial: 'SN-77310', customer: 'Nestle', health: 64, warranty: 'Active', status: 'Maintenance', category: 'HVAC', manufacturer: 'Daikin', model: 'RTU-220', location: 'Gurgaon Distribution Center', locationName: 'Gurgaon Distribution Center', pointName: 'Warehouse 3', purchaseDate: '2022-06-18', lastServiceDate: '2026-04-12', nextServiceDate: '2026-07-12' },
        { name: 'Atlas Air Compressor', serial: 'SN-19042', customer: 'Coca-Cola', health: 31, warranty: 'Expired', status: 'Out of Service', category: 'Compressor', manufacturer: 'Atlas Copco', model: 'GA-37', location: 'Whitefield Bottling Line', locationName: 'Whitefield Bottling Line', pointName: 'Compressor Room', purchaseDate: '2019-09-01', lastServiceDate: '2026-02-20', nextServiceDate: '2026-06-20' },
        { name: 'Grundfos Pump CR-15', serial: 'SN-55120', customer: 'Amazon', health: 78, warranty: 'Expiring Soon', status: 'Operational', category: 'Pump', manufacturer: 'Grundfos', model: 'CR-15', location: 'Fulfillment Center HYD-1', locationName: 'Fulfillment Center HYD-1', pointName: 'Pump House', purchaseDate: '2021-03-22', lastServiceDate: '2026-03-15', nextServiceDate: '2026-09-15' },
        { name: 'Voltas Paint Booth AC', serial: 'SN-90011', customer: 'Toyota', health: 88, warranty: 'Active', status: 'Operational', category: 'HVAC', manufacturer: 'Voltas', model: 'PB-500', location: 'Chennai Assembly Plant', locationName: 'Chennai Assembly Plant', pointName: 'Paint Shop', purchaseDate: '2023-08-01', lastServiceDate: '2026-05-20', nextServiceDate: '2026-08-20' },
        { name: 'Blue Star Cold Room Unit', serial: 'SN-90022', customer: 'IKEA', health: 55, warranty: 'Active', status: 'Maintenance', category: 'Refrigeration', manufacturer: 'Blue Star', model: 'CR-220', location: 'Navi Mumbai Store', locationName: 'Navi Mumbai Store', pointName: 'Cold Room', purchaseDate: '2022-02-11', lastServiceDate: '2026-04-01', nextServiceDate: '2026-07-01' },
        { name: 'Bosch Lab Chiller', serial: 'SN-90033', customer: 'Bosch', health: 95, warranty: 'Active', status: 'Operational', category: 'HVAC', manufacturer: 'Bosch', model: 'LC-9000', location: 'Adugodi R&D Campus', locationName: 'Adugodi R&D Campus', pointName: 'Lab Chiller Room', purchaseDate: '2024-01-15', lastServiceDate: '2026-06-01', nextServiceDate: '2026-09-01' },
        { name: 'La Marzocco Espresso Machine', serial: 'SN-90044', customer: 'Starbucks', health: 72, warranty: 'Active', status: 'Operational', category: 'Appliance', manufacturer: 'La Marzocco', model: 'Linea PB', location: 'Koramangala Roastery', locationName: 'Koramangala Roastery', pointName: 'Brew Bar', purchaseDate: '2023-05-05', lastServiceDate: '2026-05-10', nextServiceDate: '2026-08-10' },
        { name: 'Starbucks Cold Brew Chiller', serial: 'SN-90055', customer: 'Starbucks', health: 40, warranty: 'Expiring Soon', status: 'Maintenance', category: 'Refrigeration', manufacturer: 'Blue Star', model: 'CB-120', location: 'Koramangala Roastery', locationName: 'Koramangala Roastery', pointName: 'Cold Storage', purchaseDate: '2021-11-20', lastServiceDate: '2026-03-30', nextServiceDate: '2026-06-30' },
        { name: 'Reliance Frozen Aisle Rack', serial: 'SN-90066', customer: 'Reliance Retail', health: 66, warranty: 'Active', status: 'Operational', category: 'Refrigeration', manufacturer: 'Voltas', model: 'FR-800', location: 'Ahmedabad Hypermart', locationName: 'Ahmedabad Hypermart', pointName: 'Frozen Aisle', purchaseDate: '2022-09-09', lastServiceDate: '2026-04-18', nextServiceDate: '2026-07-18' },
        { name: 'Reliance Dairy Chiller', serial: 'SN-90077', customer: 'Reliance Retail', health: 83, warranty: 'Active', status: 'Operational', category: 'Refrigeration', manufacturer: 'Blue Star', model: 'DC-400', location: 'Ahmedabad Hypermart', locationName: 'Ahmedabad Hypermart', pointName: 'Dairy Chiller', purchaseDate: '2023-03-03', lastServiceDate: '2026-05-25', nextServiceDate: '2026-08-25' },
    ];
    const assetByName = new Map<string, number>();
    for (const a of assetSeed) {
        const { customer, locationName, pointName, ...scalar } = a;
        const asset = await prisma.asset.create({
            data: {
                ...scalar,
                organizationId,
                customerId: customerByName.get(customer) ?? null,
                locationId: locationByName.get(locationName) ?? null,
                deliveryPointId: pointByName.get(`${locationName}:${pointName}`) ?? null,
            },
        });
        assetByName.set(asset.name, asset.id);
    }

    // --- Work orders -----------------------------------------------------
    const workOrderSeed = [
        { customer: 'Pepsi', technician: 'Ravi Kumar', asset: 'Carrier Chiller 30XA', priority: 'High', status: 'In Progress', serviceType: 'Maintenance', location: 'Andheri Bottling Plant', due: '2026-07-05', accepted: true, description: 'Quarterly chiller maintenance', lat: 40, lng: 55 },
        { customer: 'Nestle', technician: 'Sunita Sharma', asset: 'Daikin Rooftop Unit', priority: 'Critical', status: 'Open', serviceType: 'Repair', location: 'Gurgaon Distribution Center', due: '2026-07-02', accepted: false, description: 'Rooftop unit not cooling', lat: 30, lng: 35 },
        { customer: 'Coca-Cola', technician: 'Amit Joshi', asset: 'Atlas Air Compressor', priority: 'Critical', status: 'Overdue', serviceType: 'Emergency', location: 'Whitefield Bottling Line', due: '2026-06-25', accepted: true, description: 'Compressor failure on line 2', lat: 60, lng: 70 },
        { customer: 'Amazon', technician: 'Ravi Kumar', asset: 'Grundfos Pump CR-15', priority: 'Medium', status: 'Completed', serviceType: 'Inspection', location: 'Fulfillment Center HYD-1', due: '2026-06-20', accepted: true, description: 'Annual pump inspection', lat: 50, lng: 45 },
        { customer: 'Toyota', technician: 'Rahul Verma', asset: 'Voltas Paint Booth AC', priority: 'Medium', status: 'Open', serviceType: 'Maintenance', location: 'Chennai Assembly Plant', due: '2026-07-10', accepted: false, description: 'Paint booth AC filter replacement', lat: 35, lng: 62 },
        { customer: 'IKEA', technician: 'Vikram Singh', asset: 'Blue Star Cold Room Unit', priority: 'High', status: 'In Progress', serviceType: 'Repair', location: 'Navi Mumbai Store', due: '2026-07-03', accepted: true, description: 'Cold room not holding temperature', lat: 42, lng: 40 },
        { customer: 'Bosch', technician: 'Sunita Sharma', asset: 'Bosch Lab Chiller', priority: 'Low', status: 'Open', serviceType: 'Inspection', location: 'Adugodi R&D Campus', due: '2026-07-18', accepted: false, description: 'Routine lab chiller inspection', lat: 58, lng: 30 },
        { customer: 'Starbucks', technician: 'Priya Menon', asset: 'La Marzocco Espresso Machine', priority: 'Medium', status: 'In Progress', serviceType: 'Maintenance', location: 'Koramangala Roastery', due: '2026-07-06', accepted: true, description: 'Espresso machine descaling & gasket swap', lat: 64, lng: 52 },
        { customer: 'Starbucks', technician: 'Vikram Singh', asset: 'Starbucks Cold Brew Chiller', priority: 'Critical', status: 'Overdue', serviceType: 'Emergency', location: 'Koramangala Roastery', due: '2026-06-28', accepted: true, description: 'Cold brew chiller compressor failure', lat: 66, lng: 55 },
        { customer: 'Reliance Retail', technician: 'Amit Joshi', asset: 'Reliance Frozen Aisle Rack', priority: 'High', status: 'Open', serviceType: 'Repair', location: 'Ahmedabad Hypermart', due: '2026-07-04', accepted: false, description: 'Frozen aisle rack defrost fault', lat: 28, lng: 48 },
        { customer: 'Reliance Retail', technician: 'Rahul Verma', asset: 'Reliance Dairy Chiller', priority: 'Medium', status: 'Completed', serviceType: 'Maintenance', location: 'Ahmedabad Hypermart', due: '2026-06-22', accepted: true, description: 'Dairy chiller quarterly service', lat: 30, lng: 50 },
    ];
    for (const w of workOrderSeed) {
        const { customer, technician, asset, ...scalar } = w;
        await prisma.workOrder.create({
            data: {
                ...scalar,
                organizationId,
                customerId: customerByName.get(customer) ?? null,
                technicianId: technicianByName.get(technician) ?? null,
                assetId: assetByName.get(asset) ?? null,
            },
        });
    }

    // --- Service cases ---------------------------------------------------
    const caseSeed = [
        { customer: 'Pepsi', subject: 'AC not cooling in cold storage', description: 'Temperature rising above threshold in cold storage room.', serviceType: 'Repair', priority: 'High', location: 'Andheri Bottling Plant', status: 'New' },
        { customer: 'Infosys', subject: 'Server room overheating', description: 'Server room AC tripping intermittently.', serviceType: 'Emergency', priority: 'Critical', location: 'Pune Office Campus', status: 'In Review' },
        { customer: 'Starbucks', subject: 'Espresso machine leaking', description: 'Water pooling under the brew bar espresso machine.', serviceType: 'Repair', priority: 'Medium', location: 'Indiranagar Cafe', status: 'New' },
        { customer: 'Reliance Retail', subject: 'Dairy chiller warm', description: 'Dairy chiller running above safe temperature since morning.', serviceType: 'Emergency', priority: 'High', location: 'Ahmedabad Hypermart', status: 'New' },
        { customer: 'IKEA', subject: 'Food court AHU noise', description: 'Loud rattling from the rooftop AHU over the food court.', serviceType: 'Inspection', priority: 'Low', location: 'Navi Mumbai Store', status: 'New' },
    ];
    for (const sc of caseSeed) {
        const { customer, ...scalar } = sc;
        await prisma.serviceCase.create({
            data: {
                ...scalar,
                organizationId,
                customerId: customerByName.get(customer) ?? null,
            },
        });
    }

    // --- Notifications ---------------------------------------------------
    const notificationSeed = [
        { title: 'Work order overdue', message: 'WO for Coca-Cola is past its due date.', type: 'danger', read: false },
        { title: 'New service case', message: 'Infosys reported a server room issue.', type: 'warning', read: false },
        { title: 'Job completed', message: 'Amazon pump inspection completed.', type: 'success', read: true },
        { title: 'Low stock alert', message: 'Scroll Compressor 5T is below reorder level.', type: 'info', read: false },
    ];
    for (const n of notificationSeed) {
        await prisma.notification.create({ data: { ...n, organizationId } });
    }

    // --- SLA policies (per-priority response/resolution minutes) ----------
    const slaSeed = [
        { priority: 'Critical', responseMinutes: 15, resolutionMinutes: 240 },
        { priority: 'High', responseMinutes: 30, resolutionMinutes: 480 },
        { priority: 'Medium', responseMinutes: 60, resolutionMinutes: 1440 },
        { priority: 'Low', responseMinutes: 120, resolutionMinutes: 2880 },
    ];
    for (const s of slaSeed) {
        await prisma.slaPolicy.upsert({
            where: {
                organizationId_priority: {
                    organizationId,
                    priority: s.priority,
                },
            },
            create: { ...s, organizationId },
            update: {
                responseMinutes: s.responseMinutes,
                resolutionMinutes: s.resolutionMinutes,
            },
        });
    }

    // --- Operators + coverage (Option B network) --------------------------
    const operatorSeed = [
        {
            name: 'CoolAir HVAC Services',
            categories: ['hvac', 'refrigeration'],
            status: 'Active',
            contactName: 'Rahul Menon',
            email: 'ops@coolair.example',
            phone: '+91 90000 40001',
            rating: 4.7,
            region: 'West Zone',
            areas: [
                { category: 'hvac', region: 'West Zone', postalPrefix: '400' },
                { category: 'refrigeration', region: 'West Zone', postalPrefix: '411' },
            ],
        },
        {
            name: 'BeanCo Coffee Care',
            categories: ['coffee', 'vending'],
            status: 'Active',
            contactName: 'Nisha Rao',
            email: 'support@beanco.example',
            phone: '+91 90000 40002',
            rating: 4.5,
            region: 'South Zone',
            areas: [
                { category: 'coffee', region: 'South Zone', postalPrefix: '560' },
                { category: 'vending', region: 'South Zone', postalPrefix: '500' },
            ],
        },
        {
            name: 'VendPro Solutions',
            categories: ['vending', 'general'],
            status: 'Active',
            contactName: 'Imran Shaikh',
            email: 'hello@vendpro.example',
            phone: '+91 90000 40003',
            rating: 4.2,
            region: 'North Zone',
            areas: [
                { category: 'vending', region: 'North Zone', postalPrefix: '110' },
            ],
        },
        {
            name: 'SparkTech Electrical',
            categories: ['electrical', 'general'],
            status: 'Active',
            contactName: 'Deepa Nair',
            email: 'contact@sparktech.example',
            phone: '+91 90000 40004',
            rating: 4.4,
            region: 'West Zone',
            areas: [
                { category: 'electrical', region: 'West Zone', postalPrefix: '380' },
                { category: 'general', region: 'West Zone', postalPrefix: '400' },
            ],
        },
        {
            name: 'ChillMasters Refrigeration',
            categories: ['refrigeration', 'hvac'],
            status: 'Active',
            contactName: 'Sanjay Gupta',
            email: 'ops@chillmasters.example',
            phone: '+91 90000 40005',
            rating: 4.8,
            region: 'South Zone',
            areas: [
                { category: 'refrigeration', region: 'South Zone', postalPrefix: '560' },
                { category: 'hvac', region: 'South Zone', postalPrefix: '600' },
            ],
        },
    ];
    for (const o of operatorSeed) {
        const { areas, ...scalar } = o;
        const operator = await prisma.operator.create({
            data: { ...scalar, organizationId },
        });
        for (const a of areas) {
            await prisma.serviceArea.create({
                data: { ...a, operatorId: operator.id, organizationId },
            });
        }
    }

    console.log('Domain data seeded.');
}

/**
 * Links the demo customer/technician users to real records so their portals
 * (My Sites / My Jobs) show personalized data. Runs after domain seeding and
 * is idempotent.
 */
async function linkDemoUsers(organizationId: number) {
    const pepsi = await prisma.customer.findFirst({
        where: { organizationId, name: 'Pepsi' },
    });
    if (pepsi) {
        await prisma.user.update({
            where: { email: 'customer@fieldops.dev' },
            data: { customerId: pepsi.id },
        });
    }

    const ravi = await prisma.technician.findFirst({
        where: { organizationId, name: 'Ravi Kumar' },
    });
    if (ravi) {
        await prisma.user.update({
            where: { email: 'tech@fieldops.dev' },
            data: { technicianId: ravi.id },
        });
    }
}

async function main() {
    await seedRoles();
    const org = await seedOrganization();
    await seedUsers(org.id);
    await seedDomain(org.id);
    await linkDemoUsers(org.id);
    console.log('Seed complete. Demo login: admin@fieldops.dev / Password123!');
}

main()
    .catch((error) => {
        console.log(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
