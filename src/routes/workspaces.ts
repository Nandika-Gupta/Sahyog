import express from "express";
import { prisma } from "../lib/prisma.ts";
import { authenticateToken, AuthRequest } from "../middleware/auth.ts";
import { z } from "zod";

const router = express.Router();

const workspaceSchema = z.object({
  name: z.string().min(2),
});

router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: req.user!.id,
          },
        },
      },
      include: {
        boards: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
});

router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name } = workspaceSchema.parse(req.body);
    const workspace = await prisma.workspace.create({
      data: {
        name,
        ownerId: req.user!.id,
        members: {
          create: {
            userId: req.user!.id,
            role: "ADMIN",
          },
        },
      },
    });
    res.status(201).json(workspace);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(400).json({ error: error.message || "Failed to create workspace" });
  }
});

router.get("/:id/boards", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const boards = await prisma.board.findMany({
      where: { workspaceId: req.params.id },
    });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch boards" });
  }
});

router.post("/:id/boards", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title } = z.object({ title: z.string() }).parse(req.body);
    const board = await prisma.board.create({
      data: {
        title,
        workspaceId: req.params.id,
      },
    });

    // Create default columns
    const columns = ["Todo", "In Progress", "Done"];
    await prisma.column.createMany({
      data: columns.map((title, index) => ({
        title,
        order: index,
        boardId: board.id,
      })),
    });

    res.status(201).json(board);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(400).json({ error: error.message || "Failed to create board" });
  }
});

export default router;
