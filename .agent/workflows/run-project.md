---
description: How to run and maintain the 2COMS Workforce Platform
---

# 🚀 2COMS Platform Workflow

Follow these steps to set up and run the production-ready workforce management application.

## 1. Prerequisites
- Ensure you have **PostgreSQL** running locally or a remote connection string.
- Update the `DATABASE_URL` in the `.env` file with your credentials.

## 2. Database Setup
Sync your database schema with Prisma and seed it with demo accounts.

// turbo
```bash
npm run db:push
```

// turbo
```bash
npm run db:seed
```

## 3. Start Development Server
Run the application in development mode.

// turbo
```bash
npm run dev
```

## 4. Useful Commands
- **Open Prisma Studio**: `npm run db:studio` (GUI to view/edit database data)
- **Generate Client**: `npm run db:generate` (Run this after schema changes)
- **Create Migrations**: `npm run db:migrate` (Use for production changes)

## 5. Default Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Account Manager** | admin@2coms.com | admin123 |
| **Client** | client@acme.com | client123 |
