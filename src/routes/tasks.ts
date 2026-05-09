import express from "express";
import { prisma } from "../lib/prisma.ts";
import { authenticateToken, AuthRequest } from "../middleware/auth.ts";
import { eventBus, EVENTS } from "../lib/events.ts";
import { z } from "zod";

const router = express.Router();

router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: {
        workspace: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        },
        columns: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { createdAt: "asc" },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!board) return res.status(404).json({ error: "Board not found" });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch board" });
  }
});

// Create task
router.post("/tasks", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { columnId, title, description, priority, dueDate, assignedTo } = z.object({
      columnId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      priority: z.string().optional(),
      dueDate: z.string().optional(),
      assignedTo: z.string().optional()
    }).parse(req.body);

    const task = await prisma.task.create({
      data: {
        columnId,
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Publish Event
    eventBus.publish(EVENTS.TASK_CREATED, { task, userId: req.user!.id });
    
    if (assignedTo) {
      eventBus.publish(EVENTS.TASK_ASSIGNED, { task, userId: req.user!.id });
    }

    res.status(201).json(task);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(400).json({ error: error.message || "Failed to create task" });
  }
});

// Move task
router.patch("/tasks/:id/move", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { columnId } = z.object({
      columnId: z.string()
    }).parse(req.body);

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { columnId },
      include: {
        column: {
          include: { board: true }
        }
      }
    });

    // Publish Event
    eventBus.publish(EVENTS.TASK_MOVED, { 
      taskId: task.id, 
      columnId, 
      boardId: task.column.boardId,
      workspaceId: task.column.board.workspaceId,
      userId: req.user!.id 
    });

    res.json(task);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(400).json({ error: error.message || "Failed to move task" });
  }
});

router.delete("/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id },
    });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
