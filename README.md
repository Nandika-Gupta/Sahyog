# Sahyog

Sahyog is a full-stack collaborative task management platform built for student teams and small project groups to manage workspaces, organize tasks, and collaborate in real time.

---

## Features

- JWT-based authentication
- Workspace and board management
- Drag-and-drop Kanban workflow
- Real-time task updates using Socket.IO
- Optimistic UI updates
- Responsive dark-themed interface
- Multi-user collaboration

---

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query
- Framer Motion
- Socket.io-client
- @hello-pangea/dnd

### Backend
- Node.js
- Express.js
- Prisma 5
- Socket.IO
- Zod
- JWT Authentication
- bcrypt

### Database
- SQLite

---

## Architecture

```text
Frontend (React)
      ↓
Express API + Socket.IO
      ↓
Prisma ORM
      ↓
SQLite Database
```

---

## Folder Structure

```text
src/
├── components/
├── pages/
├── hooks/
├── store/
├── services/
├── utils/
└── types/

prisma/
└── schema.prisma

server.ts
```

---

## Setup

### Install dependencies

```bash
npm install
```

### Configure environment variables

```env
JWT_SECRET=
CLIENT_URL=
```

### Run database migrations

```bash
npx prisma migrate dev
```

### Start development server

```bash
npm run dev
```

---
