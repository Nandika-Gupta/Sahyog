import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "../services/api.ts";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { io, Socket } from "socket.io-client";
import { Plus, MoreVertical, Clock, User, MessageSquare, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const queryClient = useQueryClient();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  const { data: board, isLoading, error } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => fetcher(`/tasks/${boardId}`),
    enabled: !!boardId,
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, columnId }: { taskId: string; columnId: string }) =>
      fetcher(`/tasks/tasks/${taskId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ columnId }),
      }),
    onMutate: async ({ taskId, columnId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["board", boardId] });
      const previousBoard = queryClient.getQueryData(["board", boardId]);
      
      queryClient.setQueryData(["board", boardId], (old: any) => {
        const newBoard = JSON.parse(JSON.stringify(old));
        let taskToMove: any = null;
        
        // Find and remove from old column
        for (const col of newBoard.columns) {
          const taskIdx = col.tasks.findIndex((t: any) => t.id === taskId);
          if (taskIdx !== -1) {
            [taskToMove] = col.tasks.splice(taskIdx, 1);
            break;
          }
        }
        
        // Add to new column
        if (taskToMove) {
          const targetCol = newBoard.columns.find((c: any) => c.id === columnId);
          if (targetCol) {
            targetCol.tasks.push(taskToMove);
          }
        }
        
        return newBoard;
      });

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board", boardId], context.previousBoard);
      }
    },
  });

  useEffect(() => {
    if (!boardId) return;

    const socket: Socket = io();
    socket.emit("join-board", boardId);

    socket.on("task-moved", (data) => {
      // If the move was done by another user, refetch
      // In a real optimized app, we'd apply the delta to the local state
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    });

    return () => {
      socket.disconnect();
    };
  }, [boardId, queryClient]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveTaskMutation.mutate({ 
      taskId: draggableId, 
      columnId: destination.droppableId 
    });
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading board...</div>;
  if (error) return <div className="p-8 text-center text-red-400">Board not found</div>;

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{board.title}</h1>
          <p className="text-sm text-slate-400">Manage your tasks and collaborate with your team</p>
        </div>
        <div className="flex -space-x-2">
            {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-xs font-bold text-indigo-400">
                    U
                </div>
            ))}
            <button className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-slate-950 flex items-center justify-center text-white hover:bg-indigo-500 transition-colors">
                <Plus className="w-4 h-4" />
            </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {board.columns.map((column: any) => (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-200 text-sm">{column.title}</h3>
                  <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {column.tasks.length}
                  </span>
                </div>
                <button className="text-slate-500 hover:text-slate-300">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "flex-1 flex flex-col gap-3 p-2 rounded-xl border border-dashed transition-colors duration-200",
                      snapshot.isDraggingOver ? "bg-slate-900/50 border-indigo-500/50" : "bg-transparent border-transparent"
                    )}
                  >
                    {column.tasks.map((task: any, index: number) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg cursor-grab active:cursor-grabbing hover:border-slate-700 transition-all",
                              snapshot.isDragging ? "shadow-2xl shadow-indigo-500/20 rotate-1 border-indigo-500/50" : ""
                            )}
                          >
                            <div className="flex justify-between items-start mb-3">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase",
                                    task.priority === "HIGH" ? "bg-red-500/10 text-red-500" :
                                    task.priority === "MEDIUM" ? "bg-yellow-500/10 text-yellow-500" :
                                    "bg-emerald-500/10 text-emerald-500"
                                )}>
                                    {task.priority}
                                </span>
                            </div>
                            <h4 className="font-semibold text-slate-100 text-sm mb-2">{task.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                                {task.description || "No description provided."}
                            </p>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" />
                                        <span className="text-[10px]">2</span>
                                    </div>
                                    {task.dueDate && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-[10px]">{new Date(task.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-slate-700">
                                    {task.assignee?.name?.[0].toUpperCase() || "?"}
                                </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    <button 
                      onClick={() => {
                        setSelectedColumnId(column.id);
                        setIsTaskModalOpen(true);
                      }}
                      className="group flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all text-sm mt-1"
                    >
                      <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Add Task</span>
                    </button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsTaskModalOpen(false)}
            />
            <TaskModalContent 
                columnId={selectedColumnId!} 
                onClose={() => setIsTaskModalOpen(false)} 
                boardId={boardId!}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskModalContent({ columnId, onClose, boardId }: { columnId: string, onClose: () => void, boardId: string }) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("MEDIUM");

    const mutation = useMutation({
        mutationFn: (data: any) => fetcher("/tasks/tasks", {
            method: "POST",
            body: JSON.stringify({ ...data, columnId }),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["board", boardId] });
            onClose();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({ title, description, priority });
    };

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl"
        >
            <h2 className="text-2xl font-bold mb-6">Create New Task</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                    <input
                        autoFocus
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                        placeholder="Task title..."
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32 resize-none placeholder:text-slate-600"
                        placeholder="What needs to be done?"
                    />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                   <div className="flex gap-4">
                       {["LOW", "MEDIUM", "HIGH"].map(p => (
                           <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all border",
                                    priority === p ? 
                                        (p === "HIGH" ? "bg-red-500/10 border-red-500 text-red-500" :
                                         p === "MEDIUM" ? "bg-yellow-500/10 border-yellow-500 text-yellow-500" :
                                         "bg-emerald-500/10 border-emerald-500 text-emerald-500") :
                                        "bg-slate-800 border-slate-700 text-slate-500"
                                )}
                           >
                               {p}
                           </button>
                       ))}
                   </div>
                </div>
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!title || mutation.isPending}
                        className="flex-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all px-8 shadow-lg shadow-indigo-500/20"
                    >
                        {mutation.isPending ? "Creating..." : "Create Task"}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
