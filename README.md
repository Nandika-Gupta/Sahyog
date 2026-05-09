# Sahyog

Sahyog is a real-time collaborative task management platform designed for teams to organize workspaces, manage tasks, and collaborate efficiently.

The platform provides Kanban-style workflow management with drag-and-drop task organization, secure authentication, real-time synchronization, and responsive cross-device collaboration.

## Features

### Authentication
- JWT-based authentication
- Protected routes and session persistence

### Workspace Management
- Create and manage multiple workspaces
- Organize projects inside dedicated team environments

### Kanban Boards
- Drag-and-drop task movement
- Task organization across Todo, In Progress, and Done columns

### Task Management
- Create, edit, and delete tasks
- Assign tasks to workspace members
- Add task descriptions and statuses

### Real-Time Collaboration
- Instant synchronization across users using Socket.io

### Responsive UI
- Responsive interface optimized for desktop and mobile devices

## Tech Stack

### Frontend
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- TanStack Query

### Backend
- Node.js
- Express.js
- Prisma ORM
- SQLite
- Socket.io

### Authentication & Validation
- JWT Authentication
- Bcrypt.js
- Zod

### Additional Libraries
- @hello-pangea/dnd
- Lucide React

## Architecture Overview

```text
Client (React + TypeScript)
        ↓
Node.js + Express API
        ↓
Prisma ORM
        ↓
SQLite Database
        ↓
Socket.io Real-Time Sync
```

## Folder Structure

```text
src/
├── components/     # Reusable UI components
├── pages/          # Workspace and board pages
├── hooks/          # Custom React hooks
├── store/          # Zustand state management
├── lib/            # Utility functions and configs
├── types/          # Shared TypeScript interfaces
├── App.tsx         # Root application logic
└── main.tsx        # Application entry point
```
