import 'dotenv/config';

import { createRequire } from 'node:module';
const dns = createRequire(process.cwd() + '/')('node:dns');
const origLookup = dns.lookup;
dns.lookup = (hostname: string, options: unknown, callback?: unknown) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  return origLookup.call(
    dns,
    hostname,
    { ...(options as object), family: 4 },
    callback,
  );
};
const origLookupP = dns.promises.lookup;
dns.promises.lookup = (hostname: string, options: object = {}) =>
  origLookupP.call(dns.promises, hostname, { ...options, family: 4 });

import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const ROLE_NAMES = ['Admin', 'Customer', 'Technician', 'Dispatcher', 'Manager'];

const DEMO_PASSWORD = 'Password123!';

const DEMO_USERS = [
  {
    firstName: 'Vikram',
    lastName: 'Admin',
    email: 'vikram.new.dev@gmail.com',
    role: 'Admin',
  },
  {
    firstName: 'Vikram',
    lastName: 'Admin',
    email: 'user1@gmail.com',
    role: 'Admin',
  },
  {
    firstName: 'Vikram',
    lastName: 'Admin',
    email: 'user2@gmail.com',
    role: 'Admin',
  },
  {
    firstName: 'Maya',
    lastName: 'Manager',
    email: 'manager@fieldops.dev',
    role: 'Manager',
  },
  {
    firstName: 'Dev',
    lastName: 'Dispatcher',
    email: 'dispatcher@fieldops.dev',
    role: 'Dispatcher',
  },
  {
    firstName: 'Tara',
    lastName: 'Technician',
    email: 'tech@fieldops.dev',
    role: 'Technician',
  },
  {
    firstName: 'Cara',
    lastName: 'Customer',
    email: 'customer@fieldops.dev',
    role: 'Customer',
  },
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
    return prisma.organization.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.organization.create({ data });
}

async function seedUsers(organizationId: string) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const roles = await prisma.role.findMany();
  const roleByName = new Map<string, string>(roles.map((r) => [r.name, r.id]));

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

async function seedDomain(organizationId: string) {

  const customerCount = await prisma.customer.count({
    where: { organizationId },
  });
  if (customerCount > 0) {
    console.log('Domain data already present — skipping.');
    return;
  }

  // --- Customers + locations + delivery points -------------------------
  type LocationSeed = {
    name: string;
    address: string;
    city: string;
    points: string[];
    postalCode?: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
  type CustomerSeed = {
    name: string;
    contactName: string;
    email: string;
    phone: string;
    industry: string;
    contractType: string;
    status: string;
    city: string;
    locations: LocationSeed[];
  };

  const customerSeed: CustomerSeed[] = [
    {
      name: 'Pepsi',
      contactName: 'Anita Desai',
      email: 'anita@pepsi.com',
      phone: '+91 98111 20001',
      industry: 'Food & Beverage',
      contractType: 'Enterprise',
      status: 'Active',
      city: 'Mumbai',
      locations: [
        {
          name: 'Andheri Bottling Plant',
          address: '12 MIDC Industrial Area',
          city: 'Mumbai',
          postalCode: '400093',
          state: 'Maharashtra',
          lat: 19.1197,
          lng: 72.8697,
          points: ['Loading Dock A', 'Cold Storage', 'Rooftop Plant Room'],
        },
        {
          name: 'Pune Warehouse',
          address: '88 Hinjewadi Phase 2',
          city: 'Pune',
          postalCode: '411057',
          state: 'Maharashtra',
          lat: 18.5913,
          lng: 73.7389,
          points: ['Bay 1', 'Bay 2'],
        },
      ],
    },
    {
      name: 'Nestle',
      contactName: 'Rohan Mehta',
      email: 'rohan@nestle.com',
      phone: '+91 98111 20002',
      industry: 'Food & Beverage',
      contractType: 'Premium',
      status: 'Active',
      city: 'Gurgaon',
      locations: [
        {
          name: 'Gurgaon Distribution Center',
          address: '45 Udyog Vihar',
          city: 'Gurgaon',
          postalCode: '122016',
          state: 'Haryana',
          lat: 28.5021,
          lng: 77.0854,
          points: ['Warehouse 3', 'Chiller Unit'],
        },
      ],
    },
    {
      name: 'Coca-Cola',
      contactName: 'Priya Nair',
      email: 'priya@coca-cola.com',
      phone: '+91 98111 20003',
      industry: 'Food & Beverage',
      contractType: 'Enterprise',
      status: 'Active',
      city: 'Bengaluru',
      locations: [
        {
          name: 'Whitefield Bottling Line',
          address: '21 ITPL Main Road',
          city: 'Bengaluru',
          postalCode: '560066',
          state: 'Karnataka',
          lat: 12.9856,
          lng: 77.7269,
          points: ['Bottling Line 2', 'Compressor Room'],
        },
      ],
    },
    {
      name: 'Infosys',
      contactName: 'Karthik Rao',
      email: 'karthik@infosys.com',
      phone: '+91 98111 20004',
      industry: 'Technology',
      contractType: 'Premium',
      status: 'Active',
      city: 'Pune',
      locations: [
        {
          name: 'Pune Office Campus',
          address: '7 Magarpatta City',
          city: 'Pune',
          postalCode: '411028',
          state: 'Maharashtra',
          lat: 18.5158,
          lng: 73.928,
          points: ['Office Block B', 'Server Room'],
        },
      ],
    },
    {
      name: 'Amazon',
      contactName: 'Sneha Iyer',
      email: 'sneha@amazon.com',
      phone: '+91 98111 20005',
      industry: 'Logistics',
      contractType: 'Enterprise',
      status: 'Active',
      city: 'Hyderabad',
      locations: [
        {
          name: 'Fulfillment Center HYD-1',
          address: '3 Outer Ring Road',
          city: 'Hyderabad',
          postalCode: '500019',
          state: 'Telangana',
          lat: 17.4468,
          lng: 78.3512,
          points: ['Inbound Dock', 'Pump House'],
        },
      ],
    },
    {
      name: 'Toyota',
      contactName: 'Sameer Patel',
      email: 'sameer@toyota.com',
      phone: '+91 98111 20006',
      industry: 'Manufacturing',
      contractType: 'Standard',
      status: 'Active',
      city: 'Chennai',
      locations: [
        {
          name: 'Chennai Assembly Plant',
          address: '9 Oragadam SIPCOT',
          city: 'Chennai',
          postalCode: '602105',
          state: 'Tamil Nadu',
          lat: 12.8081,
          lng: 79.9498,
          points: ['Paint Shop', 'Weld Line', 'Canteen HVAC'],
        },
      ],
    },
    {
      name: 'IKEA',
      contactName: 'Pooja Reddy',
      email: 'pooja@ikea.com',
      phone: '+91 98111 20007',
      industry: 'Retail',
      contractType: 'Standard',
      status: 'Active',
      city: 'Mumbai',
      locations: [
        {
          name: 'Navi Mumbai Store',
          address: '4 Turbhe MIDC',
          city: 'Navi Mumbai',
          postalCode: '400705',
          state: 'Maharashtra',
          lat: 19.0728,
          lng: 73.017,
          points: ['Food Court', 'Cold Room', 'Rooftop AHU'],
        },
      ],
    },
    {
      name: 'Bosch',
      contactName: 'Arjun Pillai',
      email: 'arjun@bosch.com',
      phone: '+91 98111 20008',
      industry: 'Technology',
      contractType: 'Premium',
      status: 'Active',
      city: 'Bengaluru',
      locations: [
        {
          name: 'Adugodi R&D Campus',
          address: '18 Hosur Road',
          city: 'Bengaluru',
          postalCode: '560030',
          state: 'Karnataka',
          lat: 12.9384,
          lng: 77.6084,
          points: ['Lab Chiller Room', 'Data Center'],
        },
      ],
    },
    {
      name: 'Starbucks',
      contactName: 'Meera Krishnan',
      email: 'meera@starbucks.com',
      phone: '+91 98111 20009',
      industry: 'Food & Beverage',
      contractType: 'Premium',
      status: 'Active',
      city: 'Bengaluru',
      locations: [
        {
          name: 'Koramangala Roastery',
          address: '80 Feet Road',
          city: 'Bengaluru',
          postalCode: '560034',
          state: 'Karnataka',
          lat: 12.9352,
          lng: 77.6245,
          points: ['Brew Bar', 'Cold Storage'],
        },
        {
          name: 'Indiranagar Cafe',
          address: '100 Feet Road',
          city: 'Bengaluru',
          postalCode: '560038',
          state: 'Karnataka',
          lat: 12.9784,
          lng: 77.6408,
          points: ['Espresso Station'],
        },
      ],
    },
    {
      name: 'Reliance Retail',
      contactName: 'Vikas Kulkarni',
      email: 'vikas@relianceretail.com',
      phone: '+91 98111 20010',
      industry: 'Retail',
      contractType: 'Enterprise',
      status: 'Active',
      city: 'Ahmedabad',
      locations: [
        {
          name: 'Ahmedabad Hypermart',
          address: '55 SG Highway',
          city: 'Ahmedabad',
          postalCode: '380015',
          state: 'Gujarat',
          lat: 23.0225,
          lng: 72.5714,
          points: ['Frozen Aisle', 'Dairy Chiller', 'Backroom AHU'],
        },
      ],
    },
  ];

  customerSeed.push(
    {
      name: 'Marriott Hotels',
      contactName: 'Ananya Bose',
      email: 'ananya@marriott.com',
      phone: '+91 98111 20011',
      industry: 'Hospitality',
      contractType: 'Enterprise',
      status: 'Active',
      city: 'Delhi',
      locations: [
        {
          name: 'Aerocity Marriott',
          address: '2 Asset Area 4',
          city: 'Delhi',
          postalCode: '110037',
          state: 'Delhi',
          lat: 28.5535,
          lng: 77.121,
          points: ['Kitchen Cold Room', 'Laundry Plant', 'Lobby AHU'],
        },
        {
          name: 'Whitefield Courtyard',
          address: '30 ITPL Road',
          city: 'Bengaluru',
          postalCode: '560066',
          state: 'Karnataka',
          lat: 12.9698,
          lng: 77.75,
          points: ['Banquet AHU', 'Kitchen Chiller'],
        },
      ],
    },
    {
      name: 'Apollo Hospitals',
      contactName: 'Dr. Rekha Suresh',
      email: 'rekha@apollo.com',
      phone: '+91 98111 20012',
      industry: 'Healthcare',
      contractType: 'Enterprise',
      status: 'Active',
      city: 'Chennai',
      locations: [
        {
          name: 'Greams Road Hospital',
          address: '21 Greams Lane',
          city: 'Chennai',
          postalCode: '600006',
          state: 'Tamil Nadu',
          lat: 13.0604,
          lng: 80.2496,
          points: [
            'OT Complex AHU',
            'Blood Bank Freezer',
            'Pharmacy Cold Room',
          ],
        },
      ],
    },
    {
      name: 'DMart',
      contactName: 'Nilesh Shah',
      email: 'nilesh@dmart.com',
      phone: '+91 98111 20013',
      industry: 'Retail',
      contractType: 'Standard',
      status: 'Active',
      city: 'Thane',
      locations: [
        {
          name: 'Thane Superstore',
          address: '14 Ghodbunder Road',
          city: 'Thane',
          postalCode: '400607',
          state: 'Maharashtra',
          lat: 19.2183,
          lng: 72.9781,
          points: ['Frozen Section', 'Dairy Wall', 'Backroom Chiller'],
        },
      ],
    },
    {
      name: 'Zomato Kitchens',
      contactName: 'Farhan Qureshi',
      email: 'farhan@zomato.com',
      phone: '+91 98111 20014',
      industry: 'Food & Beverage',
      contractType: 'Standard',
      status: 'Active',
      city: 'Gurgaon',
      locations: [
        {
          name: 'Sector 44 Cloud Kitchen',
          address: '9 Sector 44',
          city: 'Gurgaon',
          postalCode: '122003',
          state: 'Haryana',
          lat: 28.4506,
          lng: 77.0817,
          points: ['Prep Line Chiller', 'Walk-in Freezer'],
        },
      ],
    },
    {
      name: 'Tata Motors',
      contactName: 'Girish Deshmukh',
      email: 'girish@tatamotors.com',
      phone: '+91 98111 20015',
      industry: 'Manufacturing',
      contractType: 'Enterprise',
      status: 'Active',
      city: 'Pune',
      locations: [
        {
          name: 'Pimpri Plant',
          address: '1 Telco Road',
          city: 'Pune',
          postalCode: '411018',
          state: 'Maharashtra',
          lat: 18.6298,
          lng: 73.7997,
          points: ['Press Shop', 'Paint Booth 2', 'Compressor House'],
        },
      ],
    },
    {
      name: 'HDFC Bank',
      contactName: 'Shruti Kapoor',
      email: 'shruti@hdfcbank.com',
      phone: '+91 98111 20016',
      industry: 'Financial Services',
      contractType: 'Premium',
      status: 'Active',
      city: 'Mumbai',
      locations: [
        {
          name: 'BKC Data Center',
          address: '5 Bandra Kurla Complex',
          city: 'Mumbai',
          postalCode: '400051',
          state: 'Maharashtra',
          lat: 19.0662,
          lng: 72.8691,
          points: ['DC Hall 1', 'UPS Room', 'Precision AC Bank'],
        },
      ],
    },
    {
      name: 'Decathlon',
      contactName: 'Manav Sethi',
      email: 'manav@decathlon.com',
      phone: '+91 98111 20017',
      industry: 'Retail',
      contractType: 'Standard',
      status: 'Inactive',
      city: 'Hyderabad',
      locations: [
        {
          name: 'Kukatpally Store',
          address: '77 JNTU Road',
          city: 'Hyderabad',
          postalCode: '500072',
          state: 'Telangana',
          lat: 17.4948,
          lng: 78.3996,
          points: ['Store Floor AHU'],
        },
      ],
    },
    {
      name: 'Britannia',
      contactName: 'Lakshmi Narayan',
      email: 'lakshmi@britannia.com',
      phone: '+91 98111 20018',
      industry: 'Food & Beverage',
      contractType: 'Premium',
      status: 'Active',
      city: 'Kolkata',
      locations: [
        {
          name: 'Taratala Biscuit Plant',
          address: '15 Taratala Road',
          city: 'Kolkata',
          postalCode: '700088',
          state: 'West Bengal',
          lat: 22.5116,
          lng: 88.304,
          points: ['Oven Line 1', 'Ingredient Cold Store', 'Utility Block'],
        },
      ],
    },
  );

  const customerByName = new Map<string, string>();
  const locationByName = new Map<string, string>();
  const pointByName = new Map<string, string>();

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
          state: loc.state ?? null,
          postalCode: loc.postalCode ?? null,
          country: 'India',
          lat: loc.lat ?? null,
          lng: loc.lng ?? null,
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
    {
      name: 'Ravi Kumar',
      role: 'Senior HVAC Technician',
      status: 'Available',
      activeJobs: 2,
      rating: 4.8,
      skills: ['HVAC', 'Refrigeration'],
      email: 'ravi@acmefield.com',
      phone: '+91 90000 10001',
      region: 'West Zone',
      department: 'HVAC',
    },
    {
      name: 'Sunita Sharma',
      role: 'Electrical Engineer',
      status: 'On Job',
      activeJobs: 3,
      rating: 4.6,
      skills: ['Electrical', 'Diagnostics'],
      email: 'sunita@acmefield.com',
      phone: '+91 90000 10002',
      region: 'North Zone',
      department: 'Electrical',
    },
    {
      name: 'Amit Joshi',
      role: 'Field Technician',
      status: 'Available',
      activeJobs: 1,
      rating: 4.4,
      skills: ['Mechanical', 'Pumps'],
      email: 'amit@acmefield.com',
      phone: '+91 90000 10003',
      region: 'South Zone',
      department: 'Mechanical',
    },
    {
      name: 'Neha Gupta',
      role: 'Plumbing Specialist',
      status: 'Off Duty',
      activeJobs: 0,
      rating: 4.2,
      skills: ['Plumbing'],
      email: 'neha@acmefield.com',
      phone: '+91 90000 10004',
      region: 'Central Zone',
      department: 'Plumbing',
    },
    {
      name: 'Vikram Singh',
      role: 'Refrigeration Technician',
      status: 'Available',
      activeJobs: 1,
      rating: 4.7,
      skills: ['Refrigeration', 'HVAC'],
      email: 'vikram@acmefield.com',
      phone: '+91 90000 10005',
      region: 'South Zone',
      department: 'Refrigeration',
    },
    {
      name: 'Priya Menon',
      role: 'Coffee Equipment Specialist',
      status: 'On Job',
      activeJobs: 2,
      rating: 4.9,
      skills: ['Coffee', 'Vending'],
      email: 'priya@acmefield.com',
      phone: '+91 90000 10006',
      region: 'South Zone',
      department: 'Appliances',
    },
    {
      name: 'Rahul Verma',
      role: 'Field Technician',
      status: 'Available',
      activeJobs: 0,
      rating: 4.3,
      skills: ['Mechanical', 'Electrical'],
      email: 'rahulv@acmefield.com',
      phone: '+91 90000 10007',
      region: 'West Zone',
      department: 'Mechanical',
    },
    {
      name: 'Deepak Chauhan',
      role: 'Senior Refrigeration Technician',
      status: 'On Job',
      activeJobs: 2,
      rating: 4.9,
      skills: ['Refrigeration', 'Cold Chain', 'Diagnostics'],
      email: 'deepak@acmefield.com',
      phone: '+91 90000 10008',
      region: 'North Zone',
      department: 'Refrigeration',
      employeeId: 'EMP-1008',
      hireDate: '2019-04-15',
    },
    {
      name: 'Ananya Roy',
      role: 'HVAC Engineer',
      status: 'Available',
      activeJobs: 1,
      rating: 4.6,
      skills: ['HVAC', 'Controls', 'BMS'],
      email: 'ananya@acmefield.com',
      phone: '+91 90000 10009',
      region: 'East Zone',
      department: 'HVAC',
      employeeId: 'EMP-1009',
      hireDate: '2021-07-01',
    },
    {
      name: 'Faizal Khan',
      role: 'Electrical Technician',
      status: 'On Job',
      activeJobs: 3,
      rating: 4.1,
      skills: ['Electrical', 'UPS', 'Switchgear'],
      email: 'faizal@acmefield.com',
      phone: '+91 90000 10010',
      region: 'West Zone',
      department: 'Electrical',
      employeeId: 'EMP-1010',
      hireDate: '2022-02-10',
    },
    {
      name: 'Kavya Reddy',
      role: 'Controls Specialist',
      status: 'Available',
      activeJobs: 0,
      rating: 4.7,
      skills: ['BMS', 'Controls', 'Diagnostics'],
      email: 'kavya@acmefield.com',
      phone: '+91 90000 10011',
      region: 'South Zone',
      department: 'Controls',
      employeeId: 'EMP-1011',
      hireDate: '2020-11-23',
    },
    {
      name: 'Manoj Tiwari',
      role: 'Field Technician',
      status: 'On Leave',
      activeJobs: 0,
      rating: 3.9,
      skills: ['Mechanical', 'Plumbing'],
      email: 'manoj@acmefield.com',
      phone: '+91 90000 10012',
      region: 'North Zone',
      department: 'Mechanical',
      employeeId: 'EMP-1012',
      hireDate: '2023-01-09',
    },
    {
      name: 'Sanjana Iyer',
      role: 'Junior HVAC Technician',
      status: 'Available',
      activeJobs: 1,
      rating: 4.0,
      skills: ['HVAC'],
      email: 'sanjana@acmefield.com',
      phone: '+91 90000 10013',
      region: 'South Zone',
      department: 'HVAC',
      employeeId: 'EMP-1013',
      hireDate: '2024-06-03',
    },
    {
      name: 'Harpreet Sandhu',
      role: 'Pump & Utility Technician',
      status: 'On Job',
      activeJobs: 2,
      rating: 4.5,
      skills: ['Pumps', 'Mechanical', 'Plumbing'],
      email: 'harpreet@acmefield.com',
      phone: '+91 90000 10014',
      region: 'North Zone',
      department: 'Mechanical',
      employeeId: 'EMP-1014',
      hireDate: '2018-09-17',
    },
    {
      name: 'Elena Fernandes',
      role: 'Data Center Cooling Specialist',
      status: 'Available',
      activeJobs: 1,
      rating: 4.8,
      skills: ['HVAC', 'Precision Cooling', 'Controls'],
      email: 'elena@acmefield.com',
      phone: '+91 90000 10015',
      region: 'West Zone',
      department: 'HVAC',
      employeeId: 'EMP-1015',
      hireDate: '2020-03-30',
    },
  ];
  const technicianByName = new Map<string, string>();
  for (const t of technicianSeed) {
    const tech = await prisma.technician.create({
      data: { ...t, organizationId },
    });
    technicianByName.set(tech.name, tech.id);
  }

  // --- Parts -----------------------------------------------------------
  const partSeed = [
    {
      name: 'HEPA Filter 24x24',
      sku: 'FLT-2424',
      category: 'Filters',
      location: 'Warehouse A',
      quantity: 120,
      reorderLevel: 30,
      unitPrice: 18.5,
      supplier: 'FilterCo',
    },
    {
      name: 'Scroll Compressor 5T',
      sku: 'CMP-5T',
      category: 'Compressors',
      location: 'Warehouse B',
      quantity: 8,
      reorderLevel: 10,
      unitPrice: 640,
      supplier: 'CoolParts',
    },
    {
      name: 'Contactor 40A',
      sku: 'ELC-40A',
      category: 'Electrical',
      location: 'Van 1',
      quantity: 0,
      reorderLevel: 12,
      unitPrice: 22,
      supplier: 'ElectroSupply',
    },
    {
      name: 'Circulation Pump 1HP',
      sku: 'PMP-1HP',
      category: 'Pumps',
      location: 'Central Store',
      quantity: 25,
      reorderLevel: 8,
      unitPrice: 145,
      supplier: 'FlowTech',
    },
    {
      name: 'R-410A Refrigerant',
      sku: 'REF-410A',
      category: 'Refrigerant',
      location: 'Warehouse A',
      quantity: 40,
      reorderLevel: 15,
      unitPrice: 95,
    },
    {
      name: 'Espresso Group Head Gasket',
      sku: 'COF-GHG',
      category: 'Coffee Parts',
      location: 'Warehouse A',
      quantity: 60,
      reorderLevel: 20,
      unitPrice: 8,
      supplier: 'BrewParts',
    },
    {
      name: 'Vending Coil Motor',
      sku: 'VND-COIL',
      category: 'Vending Parts',
      location: 'Warehouse B',
      quantity: 14,
      reorderLevel: 10,
      unitPrice: 34,
      supplier: 'VendSupply',
    },
    {
      name: 'Condenser Fan Blade 18"',
      sku: 'HVAC-FAN18',
      category: 'HVAC',
      location: 'Warehouse B',
      quantity: 22,
      reorderLevel: 8,
      unitPrice: 41,
      supplier: 'CoolParts',
    },
    {
      name: 'Thermostat Digital',
      sku: 'ELC-THERM',
      category: 'Electrical',
      location: 'Van 2',
      quantity: 5,
      reorderLevel: 12,
      unitPrice: 28,
      supplier: 'ElectroSupply',
    },
    {
      name: 'Water Filter Cartridge',
      sku: 'FLT-WTR',
      category: 'Filters',
      location: 'Central Store',
      quantity: 90,
      reorderLevel: 25,
      unitPrice: 15,
      supplier: 'FilterCo',
    },
    {
      name: 'Expansion Valve TXV 3T',
      sku: 'REF-TXV3',
      category: 'Refrigerant',
      location: 'Warehouse A',
      quantity: 18,
      reorderLevel: 10,
      unitPrice: 62,
      supplier: 'CoolParts',
    },
    {
      name: 'R-134A Refrigerant',
      sku: 'REF-134A',
      category: 'Refrigerant',
      location: 'Warehouse B',
      quantity: 12,
      reorderLevel: 15,
      unitPrice: 88,
      supplier: 'CoolParts',
    },
    {
      name: 'Belt Drive V-Type A42',
      sku: 'MEC-BELT42',
      category: 'Mechanical',
      location: 'Van 1',
      quantity: 34,
      reorderLevel: 10,
      unitPrice: 12,
      supplier: 'FlowTech',
    },
    {
      name: 'Mechanical Seal 25mm',
      sku: 'PMP-SEAL25',
      category: 'Pumps',
      location: 'Central Store',
      quantity: 6,
      reorderLevel: 12,
      unitPrice: 55,
      supplier: 'FlowTech',
    },
    {
      name: 'Pressure Switch HP/LP',
      sku: 'CTL-PSW',
      category: 'Controls',
      location: 'Warehouse A',
      quantity: 27,
      reorderLevel: 10,
      unitPrice: 31,
      supplier: 'ElectroSupply',
    },
    {
      name: 'BMS Temperature Sensor',
      sku: 'CTL-TEMP',
      category: 'Controls',
      location: 'Warehouse B',
      quantity: 48,
      reorderLevel: 20,
      unitPrice: 24,
      supplier: 'SenseTech',
    },
    {
      name: 'UPS Battery 12V 100Ah',
      sku: 'ELC-BAT100',
      category: 'Electrical',
      location: 'Central Store',
      quantity: 9,
      reorderLevel: 6,
      unitPrice: 210,
      supplier: 'PowerCell',
    },
    {
      name: 'Precision AC Humidifier Canister',
      sku: 'HVAC-HUM',
      category: 'HVAC',
      location: 'Warehouse A',
      quantity: 4,
      reorderLevel: 8,
      unitPrice: 175,
      supplier: 'CoolParts',
    },
    {
      name: 'Defrost Heater Element 1.2kW',
      sku: 'REF-DEFH',
      category: 'Refrigeration',
      location: 'Van 2',
      quantity: 16,
      reorderLevel: 8,
      unitPrice: 47,
      supplier: 'CoolParts',
    },
    {
      name: 'Espresso Steam Wand Valve',
      sku: 'COF-STMV',
      category: 'Coffee Parts',
      location: 'Warehouse A',
      quantity: 21,
      reorderLevel: 10,
      unitPrice: 39,
      supplier: 'BrewParts',
    },
    {
      name: 'Vending Bill Validator',
      sku: 'VND-BILL',
      category: 'Vending Parts',
      location: 'Warehouse B',
      quantity: 3,
      reorderLevel: 5,
      unitPrice: 168,
      supplier: 'VendSupply',
    },
    {
      name: 'Copper Pipe 3/8" (per m)',
      sku: 'MEC-CU38',
      category: 'Mechanical',
      location: 'Central Store',
      quantity: 200,
      reorderLevel: 50,
      unitPrice: 6.5,
      supplier: 'MetalWorks',
    },
  ];
  for (const p of partSeed) {
    await prisma.part.create({ data: { ...p, organizationId } });
  }

  // --- Assets ----------------------------------------------------------
  const assetSeed = [
    {
      name: 'Carrier Chiller 30XA',
      serial: 'SN-48201',
      customer: 'Pepsi',
      health: 92,
      warranty: 'Active',
      status: 'Operational',
      category: 'HVAC',
      manufacturer: 'Carrier',
      model: '30XA-1002',
      location: 'Andheri Bottling Plant',
      locationName: 'Andheri Bottling Plant',
      pointName: 'Rooftop Plant Room',
      purchaseDate: '2023-01-10',
      lastServiceDate: '2026-05-02',
      nextServiceDate: '2026-08-02',
    },
    {
      name: 'Daikin Rooftop Unit',
      serial: 'SN-77310',
      customer: 'Nestle',
      health: 64,
      warranty: 'Active',
      status: 'Maintenance',
      category: 'HVAC',
      manufacturer: 'Daikin',
      model: 'RTU-220',
      location: 'Gurgaon Distribution Center',
      locationName: 'Gurgaon Distribution Center',
      pointName: 'Warehouse 3',
      purchaseDate: '2022-06-18',
      lastServiceDate: '2026-04-12',
      nextServiceDate: '2026-07-12',
    },
    {
      name: 'Atlas Air Compressor',
      serial: 'SN-19042',
      customer: 'Coca-Cola',
      health: 31,
      warranty: 'Expired',
      status: 'Out of Service',
      category: 'Compressor',
      manufacturer: 'Atlas Copco',
      model: 'GA-37',
      location: 'Whitefield Bottling Line',
      locationName: 'Whitefield Bottling Line',
      pointName: 'Compressor Room',
      purchaseDate: '2019-09-01',
      lastServiceDate: '2026-02-20',
      nextServiceDate: '2026-06-20',
    },
    {
      name: 'Grundfos Pump CR-15',
      serial: 'SN-55120',
      customer: 'Amazon',
      health: 78,
      warranty: 'Expiring Soon',
      status: 'Operational',
      category: 'Pump',
      manufacturer: 'Grundfos',
      model: 'CR-15',
      location: 'Fulfillment Center HYD-1',
      locationName: 'Fulfillment Center HYD-1',
      pointName: 'Pump House',
      purchaseDate: '2021-03-22',
      lastServiceDate: '2026-03-15',
      nextServiceDate: '2026-09-15',
    },
    {
      name: 'Voltas Paint Booth AC',
      serial: 'SN-90011',
      customer: 'Toyota',
      health: 88,
      warranty: 'Active',
      status: 'Operational',
      category: 'HVAC',
      manufacturer: 'Voltas',
      model: 'PB-500',
      location: 'Chennai Assembly Plant',
      locationName: 'Chennai Assembly Plant',
      pointName: 'Paint Shop',
      purchaseDate: '2023-08-01',
      lastServiceDate: '2026-05-20',
      nextServiceDate: '2026-08-20',
    },
    {
      name: 'Blue Star Cold Room Unit',
      serial: 'SN-90022',
      customer: 'IKEA',
      health: 55,
      warranty: 'Active',
      status: 'Maintenance',
      category: 'Refrigeration',
      manufacturer: 'Blue Star',
      model: 'CR-220',
      location: 'Navi Mumbai Store',
      locationName: 'Navi Mumbai Store',
      pointName: 'Cold Room',
      purchaseDate: '2022-02-11',
      lastServiceDate: '2026-04-01',
      nextServiceDate: '2026-07-01',
    },
    {
      name: 'Bosch Lab Chiller',
      serial: 'SN-90033',
      customer: 'Bosch',
      health: 95,
      warranty: 'Active',
      status: 'Operational',
      category: 'HVAC',
      manufacturer: 'Bosch',
      model: 'LC-9000',
      location: 'Adugodi R&D Campus',
      locationName: 'Adugodi R&D Campus',
      pointName: 'Lab Chiller Room',
      purchaseDate: '2024-01-15',
      lastServiceDate: '2026-06-01',
      nextServiceDate: '2026-09-01',
    },
    {
      name: 'La Marzocco Espresso Machine',
      serial: 'SN-90044',
      customer: 'Starbucks',
      health: 72,
      warranty: 'Active',
      status: 'Operational',
      category: 'Appliance',
      manufacturer: 'La Marzocco',
      model: 'Linea PB',
      location: 'Koramangala Roastery',
      locationName: 'Koramangala Roastery',
      pointName: 'Brew Bar',
      purchaseDate: '2023-05-05',
      lastServiceDate: '2026-05-10',
      nextServiceDate: '2026-08-10',
    },
    {
      name: 'Starbucks Cold Brew Chiller',
      serial: 'SN-90055',
      customer: 'Starbucks',
      health: 40,
      warranty: 'Expiring Soon',
      status: 'Maintenance',
      category: 'Refrigeration',
      manufacturer: 'Blue Star',
      model: 'CB-120',
      location: 'Koramangala Roastery',
      locationName: 'Koramangala Roastery',
      pointName: 'Cold Storage',
      purchaseDate: '2021-11-20',
      lastServiceDate: '2026-03-30',
      nextServiceDate: '2026-06-30',
    },
    {
      name: 'Reliance Frozen Aisle Rack',
      serial: 'SN-90066',
      customer: 'Reliance Retail',
      health: 66,
      warranty: 'Active',
      status: 'Operational',
      category: 'Refrigeration',
      manufacturer: 'Voltas',
      model: 'FR-800',
      location: 'Ahmedabad Hypermart',
      locationName: 'Ahmedabad Hypermart',
      pointName: 'Frozen Aisle',
      purchaseDate: '2022-09-09',
      lastServiceDate: '2026-04-18',
      nextServiceDate: '2026-07-18',
    },
    {
      name: 'Reliance Dairy Chiller',
      serial: 'SN-90077',
      customer: 'Reliance Retail',
      health: 83,
      warranty: 'Active',
      status: 'Operational',
      category: 'Refrigeration',
      manufacturer: 'Blue Star',
      model: 'DC-400',
      location: 'Ahmedabad Hypermart',
      locationName: 'Ahmedabad Hypermart',
      pointName: 'Dairy Chiller',
      purchaseDate: '2023-03-03',
      lastServiceDate: '2026-05-25',
      nextServiceDate: '2026-08-25',
    },
    {
      name: 'Marriott Kitchen Cold Room',
      serial: 'SN-91011',
      customer: 'Marriott Hotels',
      health: 71,
      warranty: 'Active',
      status: 'Operational',
      category: 'Refrigeration',
      manufacturer: 'Blue Star',
      model: 'KC-300',
      location: 'Aerocity Marriott',
      locationName: 'Aerocity Marriott',
      pointName: 'Kitchen Cold Room',
      purchaseDate: '2022-12-01',
      lastServiceDate: '2026-05-15',
      nextServiceDate: '2026-08-15',
    },
    {
      name: 'Marriott Lobby AHU',
      serial: 'SN-91012',
      customer: 'Marriott Hotels',
      health: 58,
      warranty: 'Expiring Soon',
      status: 'Maintenance',
      category: 'HVAC',
      manufacturer: 'Voltas',
      model: 'AHU-900',
      location: 'Aerocity Marriott',
      locationName: 'Aerocity Marriott',
      pointName: 'Lobby AHU',
      purchaseDate: '2021-08-19',
      lastServiceDate: '2026-04-05',
      nextServiceDate: '2026-07-05',
    },
    {
      name: 'Courtyard Banquet AHU',
      serial: 'SN-91013',
      customer: 'Marriott Hotels',
      health: 86,
      warranty: 'Active',
      status: 'Operational',
      category: 'HVAC',
      manufacturer: 'Daikin',
      model: 'AHU-550',
      location: 'Whitefield Courtyard',
      locationName: 'Whitefield Courtyard',
      pointName: 'Banquet AHU',
      purchaseDate: '2023-10-12',
      lastServiceDate: '2026-06-02',
      nextServiceDate: '2026-09-02',
    },
    {
      name: 'Apollo OT Complex AHU',
      serial: 'SN-91021',
      customer: 'Apollo Hospitals',
      health: 94,
      warranty: 'Active',
      status: 'Operational',
      category: 'HVAC',
      manufacturer: 'Carrier',
      model: 'OT-HEPA-4',
      location: 'Greams Road Hospital',
      locationName: 'Greams Road Hospital',
      pointName: 'OT Complex AHU',
      purchaseDate: '2024-02-20',
      lastServiceDate: '2026-06-10',
      nextServiceDate: '2026-09-10',
    },
    {
      name: 'Apollo Blood Bank Freezer',
      serial: 'SN-91022',
      customer: 'Apollo Hospitals',
      health: 47,
      warranty: 'Active',
      status: 'Maintenance',
      category: 'Refrigeration',
      manufacturer: 'Blue Star',
      model: 'BB-80',
      location: 'Greams Road Hospital',
      locationName: 'Greams Road Hospital',
      pointName: 'Blood Bank Freezer',
      purchaseDate: '2021-05-14',
      lastServiceDate: '2026-03-28',
      nextServiceDate: '2026-06-28',
    },
    {
      name: 'DMart Frozen Section Rack',
      serial: 'SN-91031',
      customer: 'DMart',
      health: 62,
      warranty: 'Expired',
      status: 'Operational',
      category: 'Refrigeration',
      manufacturer: 'Voltas',
      model: 'FR-600',
      location: 'Thane Superstore',
      locationName: 'Thane Superstore',
      pointName: 'Frozen Section',
      purchaseDate: '2019-07-07',
      lastServiceDate: '2026-04-22',
      nextServiceDate: '2026-07-22',
    },
    {
      name: 'DMart Dairy Wall',
      serial: 'SN-91032',
      customer: 'DMart',
      health: 79,
      warranty: 'Active',
      status: 'Operational',
      category: 'Refrigeration',
      manufacturer: 'Blue Star',
      model: 'DW-250',
      location: 'Thane Superstore',
      locationName: 'Thane Superstore',
      pointName: 'Dairy Wall',
      purchaseDate: '2023-01-30',
      lastServiceDate: '2026-05-18',
      nextServiceDate: '2026-08-18',
    },
    {
      name: 'Zomato Walk-in Freezer',
      serial: 'SN-91041',
      customer: 'Zomato Kitchens',
      health: 35,
      warranty: 'Expiring Soon',
      status: 'Out of Service',
      category: 'Refrigeration',
      manufacturer: 'Blue Star',
      model: 'WF-150',
      location: 'Sector 44 Cloud Kitchen',
      locationName: 'Sector 44 Cloud Kitchen',
      pointName: 'Walk-in Freezer',
      purchaseDate: '2021-09-25',
      lastServiceDate: '2026-02-14',
      nextServiceDate: '2026-05-14',
    },
    {
      name: 'Tata Compressor House Unit',
      serial: 'SN-91051',
      customer: 'Tata Motors',
      health: 68,
      warranty: 'Active',
      status: 'Operational',
      category: 'Compressor',
      manufacturer: 'Atlas Copco',
      model: 'GA-55',
      location: 'Pimpri Plant',
      locationName: 'Pimpri Plant',
      pointName: 'Compressor House',
      purchaseDate: '2020-06-11',
      lastServiceDate: '2026-04-30',
      nextServiceDate: '2026-07-30',
    },
    {
      name: 'Tata Paint Booth 2 AC',
      serial: 'SN-91052',
      customer: 'Tata Motors',
      health: 90,
      warranty: 'Active',
      status: 'Operational',
      category: 'HVAC',
      manufacturer: 'Voltas',
      model: 'PB-750',
      location: 'Pimpri Plant',
      locationName: 'Pimpri Plant',
      pointName: 'Paint Booth 2',
      purchaseDate: '2023-11-08',
      lastServiceDate: '2026-06-05',
      nextServiceDate: '2026-09-05',
    },
    {
      name: 'HDFC Precision AC Bank',
      serial: 'SN-91061',
      customer: 'HDFC Bank',
      health: 88,
      warranty: 'Active',
      status: 'Operational',
      category: 'HVAC',
      manufacturer: 'Carrier',
      model: 'PAC-40',
      location: 'BKC Data Center',
      locationName: 'BKC Data Center',
      pointName: 'Precision AC Bank',
      purchaseDate: '2024-04-02',
      lastServiceDate: '2026-06-20',
      nextServiceDate: '2026-09-20',
    },
    {
      name: 'HDFC UPS Room Cooling',
      serial: 'SN-91062',
      customer: 'HDFC Bank',
      health: 52,
      warranty: 'Expiring Soon',
      status: 'Maintenance',
      category: 'HVAC',
      manufacturer: 'Daikin',
      model: 'UPS-C20',
      location: 'BKC Data Center',
      locationName: 'BKC Data Center',
      pointName: 'UPS Room',
      purchaseDate: '2021-01-18',
      lastServiceDate: '2026-03-12',
      nextServiceDate: '2026-06-12',
    },
    {
      name: 'Britannia Oven Line 1 Exhaust',
      serial: 'SN-91071',
      customer: 'Britannia',
      health: 74,
      warranty: 'Active',
      status: 'Operational',
      category: 'HVAC',
      manufacturer: 'Voltas',
      model: 'EX-400',
      location: 'Taratala Biscuit Plant',
      locationName: 'Taratala Biscuit Plant',
      pointName: 'Oven Line 1',
      purchaseDate: '2022-07-21',
      lastServiceDate: '2026-05-08',
      nextServiceDate: '2026-08-08',
    },
    {
      name: 'Britannia Ingredient Cold Store',
      serial: 'SN-91072',
      customer: 'Britannia',
      health: 43,
      warranty: 'Expired',
      status: 'Maintenance',
      category: 'Refrigeration',
      manufacturer: 'Blue Star',
      model: 'ICS-500',
      location: 'Taratala Biscuit Plant',
      locationName: 'Taratala Biscuit Plant',
      pointName: 'Ingredient Cold Store',
      purchaseDate: '2018-11-02',
      lastServiceDate: '2026-03-19',
      nextServiceDate: '2026-06-19',
    },
    {
      name: 'Decathlon Store Floor AHU',
      serial: 'SN-91081',
      customer: 'Decathlon',
      health: 81,
      warranty: 'Active',
      status: 'Operational',
      category: 'HVAC',
      manufacturer: 'Daikin',
      model: 'AHU-320',
      location: 'Kukatpally Store',
      locationName: 'Kukatpally Store',
      pointName: 'Store Floor AHU',
      purchaseDate: '2023-06-15',
      lastServiceDate: '2026-05-30',
      nextServiceDate: '2026-08-30',
    },
  ];
  const assetByName = new Map<string, string>();
  for (const a of assetSeed) {
    const { customer, locationName, pointName, ...scalar } = a;
    const asset = await prisma.asset.create({
      data: {
        ...scalar,
        organizationId,
        customerId: customerByName.get(customer) ?? null,
        locationId: locationByName.get(locationName) ?? null,
        deliveryPointId:
          pointByName.get(`${locationName}:${pointName}`) ?? null,
      },
    });
    assetByName.set(asset.name, asset.id);
  }

  // --- Work orders -----------------------------------------------------
  const workOrderSeed = [
    {
      customer: 'Pepsi',
      technician: 'Ravi Kumar',
      asset: 'Carrier Chiller 30XA',
      priority: 'High',
      status: 'In Progress',
      serviceType: 'Maintenance',
      location: 'Andheri Bottling Plant',
      due: '2026-07-05',
      accepted: true,
      description: 'Quarterly chiller maintenance',
      lat: 40,
      lng: 55,
    },
    {
      customer: 'Nestle',
      technician: 'Sunita Sharma',
      asset: 'Daikin Rooftop Unit',
      priority: 'Critical',
      status: 'Open',
      serviceType: 'Repair',
      location: 'Gurgaon Distribution Center',
      due: '2026-07-02',
      accepted: false,
      description: 'Rooftop unit not cooling',
      lat: 30,
      lng: 35,
    },
    {
      customer: 'Coca-Cola',
      technician: 'Amit Joshi',
      asset: 'Atlas Air Compressor',
      priority: 'Critical',
      status: 'Overdue',
      serviceType: 'Emergency',
      location: 'Whitefield Bottling Line',
      due: '2026-06-25',
      accepted: true,
      description: 'Compressor failure on line 2',
      lat: 60,
      lng: 70,
    },
    {
      customer: 'Amazon',
      technician: 'Ravi Kumar',
      asset: 'Grundfos Pump CR-15',
      priority: 'Medium',
      status: 'Completed',
      serviceType: 'Inspection',
      location: 'Fulfillment Center HYD-1',
      due: '2026-06-20',
      accepted: true,
      description: 'Annual pump inspection',
      lat: 50,
      lng: 45,
    },
    {
      customer: 'Toyota',
      technician: 'Rahul Verma',
      asset: 'Voltas Paint Booth AC',
      priority: 'Medium',
      status: 'Open',
      serviceType: 'Maintenance',
      location: 'Chennai Assembly Plant',
      due: '2026-07-10',
      accepted: false,
      description: 'Paint booth AC filter replacement',
      lat: 35,
      lng: 62,
    },
    {
      customer: 'IKEA',
      technician: 'Vikram Singh',
      asset: 'Blue Star Cold Room Unit',
      priority: 'High',
      status: 'In Progress',
      serviceType: 'Repair',
      location: 'Navi Mumbai Store',
      due: '2026-07-03',
      accepted: true,
      description: 'Cold room not holding temperature',
      lat: 42,
      lng: 40,
    },
    {
      customer: 'Bosch',
      technician: 'Sunita Sharma',
      asset: 'Bosch Lab Chiller',
      priority: 'Low',
      status: 'Open',
      serviceType: 'Inspection',
      location: 'Adugodi R&D Campus',
      due: '2026-07-18',
      accepted: false,
      description: 'Routine lab chiller inspection',
      lat: 58,
      lng: 30,
    },
    {
      customer: 'Starbucks',
      technician: 'Priya Menon',
      asset: 'La Marzocco Espresso Machine',
      priority: 'Medium',
      status: 'In Progress',
      serviceType: 'Maintenance',
      location: 'Koramangala Roastery',
      due: '2026-07-06',
      accepted: true,
      description: 'Espresso machine descaling & gasket swap',
      lat: 64,
      lng: 52,
    },
    {
      customer: 'Starbucks',
      technician: 'Vikram Singh',
      asset: 'Starbucks Cold Brew Chiller',
      priority: 'Critical',
      status: 'Overdue',
      serviceType: 'Emergency',
      location: 'Koramangala Roastery',
      due: '2026-06-28',
      accepted: true,
      description: 'Cold brew chiller compressor failure',
      lat: 66,
      lng: 55,
    },
    {
      customer: 'Reliance Retail',
      technician: 'Amit Joshi',
      asset: 'Reliance Frozen Aisle Rack',
      priority: 'High',
      status: 'Open',
      serviceType: 'Repair',
      location: 'Ahmedabad Hypermart',
      due: '2026-07-04',
      accepted: false,
      description: 'Frozen aisle rack defrost fault',
      lat: 28,
      lng: 48,
    },
    {
      customer: 'Reliance Retail',
      technician: 'Rahul Verma',
      asset: 'Reliance Dairy Chiller',
      priority: 'Medium',
      status: 'Completed',
      serviceType: 'Maintenance',
      location: 'Ahmedabad Hypermart',
      due: '2026-06-22',
      accepted: true,
      description: 'Dairy chiller quarterly service',
      lat: 30,
      lng: 50,
    },
    {
      customer: 'Marriott Hotels',
      technician: 'Deepak Chauhan',
      asset: 'Marriott Kitchen Cold Room',
      priority: 'High',
      status: 'In Progress',
      serviceType: 'Repair',
      location: 'Aerocity Marriott',
      due: '2026-08-06',
      accepted: true,
      description: 'Kitchen cold room door seal failure',
      lat: 45,
      lng: 38,
    },
    {
      customer: 'Marriott Hotels',
      technician: 'Faizal Khan',
      asset: 'Marriott Lobby AHU',
      priority: 'Medium',
      status: 'Open',
      serviceType: 'Maintenance',
      location: 'Aerocity Marriott',
      due: '2026-08-12',
      accepted: false,
      description: 'Lobby AHU belt and filter change',
      lat: 46,
      lng: 39,
    },
    {
      customer: 'Marriott Hotels',
      technician: 'Kavya Reddy',
      asset: 'Courtyard Banquet AHU',
      priority: 'Low',
      status: 'Scheduled',
      serviceType: 'Inspection',
      location: 'Whitefield Courtyard',
      due: '2026-08-20',
      accepted: true,
      description: 'Banquet AHU controls calibration',
      lat: 62,
      lng: 50,
    },
    {
      customer: 'Apollo Hospitals',
      technician: 'Sanjana Iyer',
      asset: 'Apollo OT Complex AHU',
      priority: 'High',
      status: 'Scheduled',
      serviceType: 'Maintenance',
      location: 'Greams Road Hospital',
      due: '2026-08-09',
      accepted: true,
      description: 'OT complex HEPA filter integrity test',
      lat: 36,
      lng: 64,
    },
    {
      customer: 'Apollo Hospitals',
      technician: 'Deepak Chauhan',
      asset: 'Apollo Blood Bank Freezer',
      priority: 'Critical',
      status: 'In Progress',
      serviceType: 'Emergency',
      location: 'Greams Road Hospital',
      due: '2026-08-04',
      accepted: true,
      description: 'Blood bank freezer temperature excursion alarm',
      lat: 37,
      lng: 65,
    },
    {
      customer: 'DMart',
      technician: 'Vikram Singh',
      asset: 'DMart Frozen Section Rack',
      priority: 'Medium',
      status: 'Open',
      serviceType: 'Repair',
      location: 'Thane Superstore',
      due: '2026-08-11',
      accepted: false,
      description: 'Frozen section rack icing up on evaporator',
      lat: 44,
      lng: 41,
    },
    {
      customer: 'DMart',
      technician: 'Harpreet Sandhu',
      asset: 'DMart Dairy Wall',
      priority: 'Low',
      status: 'Completed',
      serviceType: 'Inspection',
      location: 'Thane Superstore',
      due: '2026-07-25',
      accepted: true,
      description: 'Dairy wall temperature log verification',
      lat: 44,
      lng: 42,
    },
    {
      customer: 'Zomato Kitchens',
      technician: 'Deepak Chauhan',
      asset: 'Zomato Walk-in Freezer',
      priority: 'Critical',
      status: 'Overdue',
      serviceType: 'Emergency',
      location: 'Sector 44 Cloud Kitchen',
      due: '2026-07-28',
      accepted: true,
      description: 'Walk-in freezer down — full stock at risk',
      lat: 31,
      lng: 36,
    },
    {
      customer: 'Tata Motors',
      technician: 'Amit Joshi',
      asset: 'Tata Compressor House Unit',
      priority: 'High',
      status: 'In Progress',
      serviceType: 'Repair',
      location: 'Pimpri Plant',
      due: '2026-08-07',
      accepted: true,
      description: 'Air compressor pressure drop across plant',
      lat: 41,
      lng: 44,
    },
    {
      customer: 'Tata Motors',
      technician: 'Rahul Verma',
      asset: 'Tata Paint Booth 2 AC',
      priority: 'Medium',
      status: 'Scheduled',
      serviceType: 'Maintenance',
      location: 'Pimpri Plant',
      due: '2026-08-18',
      accepted: true,
      description: 'Paint booth 2 AC quarterly service',
      lat: 41,
      lng: 45,
    },
    {
      customer: 'HDFC Bank',
      technician: 'Elena Fernandes',
      asset: 'HDFC Precision AC Bank',
      priority: 'High',
      status: 'Open',
      serviceType: 'Inspection',
      location: 'BKC Data Center',
      due: '2026-08-08',
      accepted: false,
      description: 'Precision AC bank redundancy check before audit',
      lat: 43,
      lng: 37,
    },
    {
      customer: 'HDFC Bank',
      technician: 'Faizal Khan',
      asset: 'HDFC UPS Room Cooling',
      priority: 'Critical',
      status: 'In Progress',
      serviceType: 'Emergency',
      location: 'BKC Data Center',
      due: '2026-08-04',
      accepted: true,
      description: 'UPS room temperature above 30C — cooling degraded',
      lat: 43,
      lng: 38,
    },
    {
      customer: 'Britannia',
      technician: 'Ananya Roy',
      asset: 'Britannia Oven Line 1 Exhaust',
      priority: 'Medium',
      status: 'Open',
      serviceType: 'Maintenance',
      location: 'Taratala Biscuit Plant',
      due: '2026-08-14',
      accepted: false,
      description: 'Oven line 1 exhaust fan vibration',
      lat: 55,
      lng: 25,
    },
    {
      customer: 'Britannia',
      technician: 'Ananya Roy',
      asset: 'Britannia Ingredient Cold Store',
      priority: 'High',
      status: 'Overdue',
      serviceType: 'Repair',
      location: 'Taratala Biscuit Plant',
      due: '2026-07-30',
      accepted: true,
      description: 'Ingredient cold store not reaching setpoint',
      lat: 56,
      lng: 26,
    },
    {
      customer: 'Decathlon',
      technician: 'Sanjana Iyer',
      asset: 'Decathlon Store Floor AHU',
      priority: 'Low',
      status: 'Cancelled',
      serviceType: 'Inspection',
      location: 'Kukatpally Store',
      due: '2026-07-20',
      accepted: false,
      description: 'Store floor AHU inspection — cancelled, store on hold',
      lat: 52,
      lng: 47,
    },
    {
      customer: 'Starbucks',
      technician: 'Priya Menon',
      asset: 'La Marzocco Espresso Machine',
      priority: 'Low',
      status: 'Completed',
      serviceType: 'Inspection',
      location: 'Indiranagar Cafe',
      due: '2026-07-15',
      accepted: true,
      description: 'Espresso station water filter check',
      lat: 65,
      lng: 53,
    },
    {
      customer: 'Infosys',
      technician: 'Kavya Reddy',
      asset: 'Bosch Lab Chiller',
      priority: 'Medium',
      status: 'Scheduled',
      serviceType: 'Maintenance',
      location: 'Pune Office Campus',
      due: '2026-08-16',
      accepted: true,
      description: 'Server room precision cooling PM visit',
      lat: 39,
      lng: 43,
    },
  ];

  const NOW = new Date('2026-08-03T09:00:00.000Z');
  const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000);

  const createdWorkOrders: {
    id: string;
    technician: string;
    status: string;
  }[] = [];
  for (const w of workOrderSeed) {
    const { customer, technician, asset, location, ...scalar } = w;
    const responded = ['In Progress', 'Completed', 'Overdue'].includes(
      w.status,
    );
    const resolved = w.status === 'Completed';
    const workOrder = await prisma.workOrder.create({
      data: {
        ...scalar,
        location,
        organizationId,
        customerId: customerByName.get(customer) ?? null,
        technicianId: technicianByName.get(technician) ?? null,
        assetId: assetByName.get(asset) ?? null,
        locationId: locationByName.get(location) ?? null,
        respondedAt: responded ? hoursAgo(30) : null,
        resolvedAt: resolved ? hoursAgo(6) : null,
      },
    });
    createdWorkOrders.push({
      id: workOrder.id,
      technician,
      status: workOrder.status,
    });
  }

  // --- Work order event history ----------------------------------------
  for (const wo of createdWorkOrders) {
    const events: {
      type: string;
      fromValue?: string;
      toValue?: string;
      note?: string;
      actorName: string;
      actorRole: string;
    }[] = [
      {
        type: 'created',
        toValue: 'Open',
        note: 'Work order raised from service case intake.',
        actorName: 'Dev Dispatcher',
        actorRole: 'Dispatcher',
      },
      {
        type: 'assigned',
        toValue: wo.technician,
        note: `Assigned to ${wo.technician}.`,
        actorName: 'Dev Dispatcher',
        actorRole: 'Dispatcher',
      },
    ];

    if (['In Progress', 'Completed', 'Overdue'].includes(wo.status)) {
      events.push({
        type: 'accepted',
        fromValue: 'Open',
        toValue: 'In Progress',
        note: 'Technician accepted and travelling to site.',
        actorName: wo.technician,
        actorRole: 'Technician',
      });
    }
    if (wo.status === 'Completed') {
      events.push(
        {
          type: 'note',
          note: 'Work carried out, readings back within spec.',
          actorName: wo.technician,
          actorRole: 'Technician',
        },
        {
          type: 'status_changed',
          fromValue: 'In Progress',
          toValue: 'Completed',
          note: 'Job closed and signed off by site contact.',
          actorName: wo.technician,
          actorRole: 'Technician',
        },
      );
    }
    if (wo.status === 'Overdue') {
      events.push({
        type: 'status_changed',
        fromValue: 'In Progress',
        toValue: 'Overdue',
        note: 'Passed due date — parts awaited.',
        actorName: 'Maya Manager',
        actorRole: 'Manager',
      });
    }
    if (wo.status === 'Cancelled') {
      events.push({
        type: 'status_changed',
        fromValue: 'Open',
        toValue: 'Cancelled',
        note: 'Cancelled at customer request.',
        actorName: 'Maya Manager',
        actorRole: 'Manager',
      });
    }

    for (const e of events) {
      await prisma.workOrderEvent.create({
        data: { ...e, workOrderId: wo.id },
      });
    }
  }

  // --- Service cases ---------------------------------------------------
  const caseSeed = [
    {
      customer: 'Pepsi',
      subject: 'AC not cooling in cold storage',
      description: 'Temperature rising above threshold in cold storage room.',
      serviceType: 'Repair',
      priority: 'High',
      location: 'Andheri Bottling Plant',
      status: 'New',
    },
    {
      customer: 'Infosys',
      subject: 'Server room overheating',
      description: 'Server room AC tripping intermittently.',
      serviceType: 'Emergency',
      priority: 'Critical',
      location: 'Pune Office Campus',
      status: 'In Review',
    },
    {
      customer: 'Starbucks',
      subject: 'Espresso machine leaking',
      description: 'Water pooling under the brew bar espresso machine.',
      serviceType: 'Repair',
      priority: 'Medium',
      location: 'Indiranagar Cafe',
      status: 'New',
    },
    {
      customer: 'Reliance Retail',
      subject: 'Dairy chiller warm',
      description:
        'Dairy chiller running above safe temperature since morning.',
      serviceType: 'Emergency',
      priority: 'High',
      location: 'Ahmedabad Hypermart',
      status: 'New',
    },
    {
      customer: 'IKEA',
      subject: 'Food court AHU noise',
      description: 'Loud rattling from the rooftop AHU over the food court.',
      serviceType: 'Inspection',
      priority: 'Low',
      location: 'Navi Mumbai Store',
      status: 'New',
    },
    {
      customer: 'Marriott Hotels',
      subject: 'Laundry plant steam leak',
      description:
        'Steam escaping from the laundry plant header, room is fogging up.',
      serviceType: 'Emergency',
      priority: 'Critical',
      location: 'Aerocity Marriott',
      status: 'In Review',
      category: 'general',
    },
    {
      customer: 'Apollo Hospitals',
      subject: 'Pharmacy cold room alarm',
      description: 'Pharmacy cold room repeatedly alarming overnight above 8C.',
      serviceType: 'Emergency',
      priority: 'Critical',
      location: 'Greams Road Hospital',
      status: 'Assigned',
      category: 'refrigeration',
    },
    {
      customer: 'DMart',
      subject: 'Backroom chiller noisy',
      description: 'Backroom chiller making grinding noise since restock.',
      serviceType: 'Repair',
      priority: 'Medium',
      location: 'Thane Superstore',
      status: 'New',
      category: 'refrigeration',
    },
    {
      customer: 'Zomato Kitchens',
      subject: 'Prep line chiller warm',
      description: 'Prep line chiller holding 12C, prep stock being moved out.',
      serviceType: 'Repair',
      priority: 'High',
      location: 'Sector 44 Cloud Kitchen',
      status: 'In Review',
      category: 'refrigeration',
    },
    {
      customer: 'Tata Motors',
      subject: 'Press shop ventilation weak',
      description: 'Press shop extraction noticeably weaker on the east bay.',
      serviceType: 'Inspection',
      priority: 'Medium',
      location: 'Pimpri Plant',
      status: 'New',
      category: 'hvac',
    },
    {
      customer: 'HDFC Bank',
      subject: 'DC Hall 1 hot aisle spike',
      description: 'Hot aisle temperature spiking during peak batch window.',
      serviceType: 'Emergency',
      priority: 'Critical',
      location: 'BKC Data Center',
      status: 'Assigned',
      category: 'hvac',
    },
    {
      customer: 'Britannia',
      subject: 'Utility block panel tripping',
      description: 'Utility block distribution panel tripping twice a shift.',
      serviceType: 'Repair',
      priority: 'High',
      location: 'Taratala Biscuit Plant',
      status: 'In Review',
      category: 'electrical',
    },
    {
      customer: 'Marriott Hotels',
      subject: 'Kitchen chiller service due',
      description: 'Banquet kitchen chiller past its scheduled service window.',
      serviceType: 'Maintenance',
      priority: 'Low',
      location: 'Whitefield Courtyard',
      status: 'Closed',
      category: 'refrigeration',
    },
  ];
  for (const sc of caseSeed) {
    const { customer, ...scalar } = sc;
    const serviceCase = await prisma.serviceCase.create({
      data: {
        ...scalar,
        organizationId,
        customerId: customerByName.get(customer) ?? null,
        locationId: locationByName.get(sc.location) ?? null,
      },
    });

    const caseEvents: {
      type: string;
      fromValue?: string;
      toValue?: string;
      note?: string;
      actorName: string;
      actorRole: string;
    }[] = [
      {
        type: 'created',
        toValue: 'New',
        note: `Case raised by ${customer}.`,
        actorName: 'Cara Customer',
        actorRole: 'Customer',
      },
    ];
    if (['In Review', 'Assigned', 'Closed'].includes(sc.status)) {
      caseEvents.push({
        type: 'status_changed',
        fromValue: 'New',
        toValue: 'In Review',
        note: 'Picked up by dispatch for triage.',
        actorName: 'Dev Dispatcher',
        actorRole: 'Dispatcher',
      });
    }
    if (['Assigned', 'Closed'].includes(sc.status)) {
      caseEvents.push(
        {
          type: 'operator_interest',
          toValue: 'CoolAir HVAC Services',
          note: 'Operator expressed interest in servicing this case.',
          actorName: 'Rahul Menon',
          actorRole: 'Operator',
        },
        {
          type: 'operator_assigned',
          toValue: 'CoolAir HVAC Services',
          note: 'Case assigned to operator by platform dispatch.',
          actorName: 'Dev Dispatcher',
          actorRole: 'Dispatcher',
        },
      );
    }
    if (sc.status === 'Closed') {
      caseEvents.push({
        type: 'status_changed',
        fromValue: 'Assigned',
        toValue: 'Closed',
        note: 'Work completed and case closed.',
        actorName: 'Maya Manager',
        actorRole: 'Manager',
      });
    }

    for (const e of caseEvents) {
      await prisma.serviceCaseEvent.create({
        data: { ...e, serviceCaseId: serviceCase.id },
      });
    }
  }

  // --- Technician event history ----------------------------------------
  for (const t of technicianSeed) {
    const technicianId = technicianByName.get(t.name);
    if (!technicianId) continue;
    await prisma.technicianEvent.create({
      data: {
        technicianId,
        type: 'created',
        toValue: t.name,
        note: `Technician onboarded to ${t.department ?? 'Field Service'}.`,
        actorName: 'Maya Manager',
        actorRole: 'Manager',
      },
    });
    await prisma.technicianEvent.create({
      data: {
        technicianId,
        type: 'status_changed',
        fromValue: 'Available',
        toValue: t.status,
        note: `Status set to ${t.status}.`,
        actorName: 'Dev Dispatcher',
        actorRole: 'Dispatcher',
      },
    });
  }

  // --- Notifications ---------------------------------------------------
  const notificationSeed = [
    {
      title: 'Work order overdue',
      message: 'WO for Coca-Cola is past its due date.',
      type: 'danger',
      read: false,
    },
    {
      title: 'New service case',
      message: 'Infosys reported a server room issue.',
      type: 'warning',
      read: false,
    },
    {
      title: 'Job completed',
      message: 'Amazon pump inspection completed.',
      type: 'success',
      read: true,
    },
    {
      title: 'Low stock alert',
      message: 'Scroll Compressor 5T is below reorder level.',
      type: 'info',
      read: false,
    },
    {
      title: 'Critical case raised',
      message: 'Apollo Hospitals reported a pharmacy cold room alarm.',
      type: 'danger',
      read: false,
    },
    {
      title: 'Freezer down',
      message:
        'Zomato Kitchens walk-in freezer is out of service — stock at risk.',
      type: 'danger',
      read: false,
    },
    {
      title: 'SLA breach imminent',
      message:
        'HDFC Bank UPS room emergency is approaching its resolution SLA.',
      type: 'warning',
      read: false,
    },
    {
      title: 'Technician on leave',
      message: 'Manoj Tiwari is on leave — 0 jobs reassigned.',
      type: 'info',
      read: true,
    },
    {
      title: 'Operator interest',
      message: 'CoolAir HVAC Services expressed interest in 2 open cases.',
      type: 'info',
      read: false,
    },
    {
      title: 'Stock replenished',
      message: 'Copper Pipe 3/8" restocked to 200 m at Central Store.',
      type: 'success',
      read: true,
    },
    {
      title: 'Work order cancelled',
      message: 'Decathlon Kukatpally inspection cancelled by customer.',
      type: 'warning',
      read: true,
    },
    {
      title: 'Asset health drop',
      message: 'Britannia Ingredient Cold Store health fell to 43%.',
      type: 'warning',
      read: false,
    },
    {
      title: 'Maintenance completed',
      message: 'DMart dairy wall temperature log verification closed.',
      type: 'success',
      read: true,
    },
    {
      title: 'New customer onboarded',
      message: 'Britannia added with 1 site and 3 delivery points.',
      type: 'success',
      read: true,
    },
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
        {
          category: 'refrigeration',
          region: 'South Zone',
          postalPrefix: '560',
        },
        { category: 'hvac', region: 'South Zone', postalPrefix: '600' },
      ],
    },
    {
      name: 'MetroCool Facilities',
      categories: ['hvac', 'general'],
      status: 'Active',
      contactName: 'Aditya Bansal',
      email: 'ops@metrocool.example',
      phone: '+91 90000 40006',
      rating: 4.6,
      region: 'North Zone',
      areas: [
        { category: 'hvac', region: 'North Zone', postalPrefix: '110' },
        { category: 'general', region: 'North Zone', postalPrefix: '122' },
      ],
    },
    {
      name: 'EastCoast Service Group',
      categories: ['refrigeration', 'electrical'],
      status: 'Active',
      contactName: 'Sourav Ghosh',
      email: 'desk@eastcoast.example',
      phone: '+91 90000 40007',
      rating: 4.1,
      region: 'East Zone',
      areas: [
        { category: 'refrigeration', region: 'East Zone', postalPrefix: '700' },
        { category: 'electrical', region: 'East Zone', postalPrefix: '700' },
      ],
    },
    {
      name: 'PrecisionAir Data Centers',
      categories: ['hvac'],
      status: 'Active',
      contactName: 'Ritu Malhotra',
      email: 'ops@precisionair.example',
      phone: '+91 90000 40008',
      rating: 4.9,
      region: 'West Zone',
      areas: [{ category: 'hvac', region: 'West Zone', postalPrefix: '400' }],
    },
    {
      name: 'SouthStar Maintenance',
      categories: ['general', 'coffee'],
      status: 'Inactive',
      contactName: 'Bharath Kumar',
      email: 'hello@southstar.example',
      phone: '+91 90000 40009',
      rating: 3.8,
      region: 'South Zone',
      areas: [
        { category: 'general', region: 'South Zone', postalPrefix: '560' },
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

async function linkDemoUsers(organizationId: string) {
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
