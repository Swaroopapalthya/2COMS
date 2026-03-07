# 2COMS — Workforce Management Platform

A production-ready, AI-first web application designed for **ABC Corp** to manage clients, projects, trainees, vendors, training, and hiring workflows.

## 🏗️ Tech Stack

- **Frontend**: Next.js 16 (React 19), Tailwind CSS 4, React Flow
- **State Management**: Zustand (with Persistence)
- **Backend**: Next.js API Routes (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based Auth with RBAC (Role-Based Access Control)
- **Validation**: Zod & React Hook Form

## ✨ Key Features

### 1. GUI Workflow Builder
- Built with **React Flow**.
- Drag-and-drop nodes to define project lifecycles.
- Support for Project Decisions, Training Selection, Vendor Assignment, and Hiring Stages.
- Save and load workflows per project.

### 2. Role-Based Access Control (RBAC)
- **Account Manager**: Full access to create clients, projects, vendors, and define workflows.
- **Client**: Restricted access to view projects, trainees, and manage the interview pipeline.

### 3. Business Logic Automation
- **Project Rules**: On-site projects automatically require at least 2 training sessions.
- **Trainee Tracking**: Monitor progress from "Active" to "Certified" to "Hired".
- **Hiring Pipeline**: Kanban-style interface for managing interviews, shortlists, and offer letters.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL instance

### Setup
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Update the `DATABASE_URL` in `.env`.

3. **Initialize Database**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Run Project**:
   ```bash
   npm run dev
   ```

### Demo Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Account Manager** | `admin@2coms.com` | `admin123` |
| **Client** | `client@acme.com` | `client123` |

## 📂 Project Structure

- `/app`: Next.js pages and API routes.
- `/components`: UI components and page logic.
- `/lib`: Reusable utilities (Prisma client, Auth, API client).
- `/store`: Zustand state management.
- `/prisma`: Schema definition and seed data.
- `/middleware.ts`: RBAC and Auth protection.
