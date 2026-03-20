# FieldOps360 API

**FieldOps-API** is the backend service for **FieldOps360**, a full-featured Field Service Management (FSM) platform designed to streamline service request handling, technician dispatching, and SLA compliance.

Built with **NestJS**, **Express**, **PostgreSQL**, and **Prisma ORM**, this API powers the business logic, role-based access control, real-time SLA tracking, and work order lifecycle management for the FieldOps ecosystem.

---

## 🔧 Key Capabilities

- **User & Role Management**  
  Supports roles like Customer, Technician, Dispatcher, Manager, and Admin with secure authentication and role-based permissions.

- **Service Request Lifecycle**  
  Handles request creation, technician assignment, job updates, and completion flows.

- **SLA Tracking**  
  Automates SLA policy application with deadlines, pause/resume timers, breach detection, and escalation triggers.

- **Work Order Management**  
  Enables dispatchers to assign and schedule jobs, and technicians to log time, update progress, and complete tasks.

- **Inventory & Parts**  
  Tracks parts usage and stock levels tied to work orders and inventory locations.

- **Notifications & Escalations**  
  Sends real-time alerts to relevant users and supports both automated and manual escalation paths.

- **Modular API Structure**  
  Organized and scalable endpoints following RESTful conventions (or extendable via GraphQL).

---

## ⚙️ Tech Stack

- **NestJS** – Modular TypeScript backend framework
- **Express** – HTTP server layer under NestJS
- **PostgreSQL** – Relational database engine
- **Prisma ORM** – Type-safe, schema-first database access and migrations
- **JWT** – Secure authentication & role-based access control
- **WebSocket** – Real-time event handling (e.g., SLA updates, technician tracking)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (preferred package manager)
- [PostgreSQL](https://www.postgresql.org/) database

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/fieldops-api.git
cd fieldops-api

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your DB credentials