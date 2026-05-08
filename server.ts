import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./src/routes/auth.ts";
import workspaceRoutes from "./src/routes/workspaces.ts";
import taskRoutes from "./src/routes/tasks.ts";
import { eventBus, EVENTS } from "./src/lib/events.ts";
import { prisma } from "./src/lib/prisma.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // Socket.IO Logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-board", (boardId) => {
      socket.join(`board:${boardId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Event Driven Notifications & Real-time Broadcasting
  eventBus.subscribe(EVENTS.TASK_MOVED, (data) => {
    io.to(`board:${data.boardId}`).emit("task-moved", data);
  });

  eventBus.subscribe(EVENTS.TASK_CREATED, (data) => {
    // In a real app, you might find the boardId from the column
    // For simplicity, we can broadcast to the board if we have the id
    // We'll rely on the client refreshing for now or more precise events
  });

  eventBus.subscribe(EVENTS.TASK_ASSIGNED, async (data) => {
    if (data.task.assignedTo) {
      try {
        await prisma.notification.create({
          data: {
            userId: data.task.assignedTo,
            title: "New Task Assigned",
            message: `You have been assigned to task: ${data.task.title}`,
            type: "TASK_ASSIGNED",
          }
        });
        // Real-time notification if user is online
        io.emit(`notification:${data.task.assignedTo}`, {
          message: `You have been assigned to task: ${data.task.title}`
        });
      } catch (err) {
        console.error("Failed to create notification", err);
      }
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Sahyog API is running" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/workspaces", workspaceRoutes);
  app.use("/api/tasks", taskRoutes);

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
