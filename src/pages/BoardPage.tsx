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
    <div className="h-full flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-white">{board.title}</h1>
            <div className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              Live
            </div>
          </div>
          <p className="text-slate-400 font-medium">Sprint 12 • Active Collaborators: 4</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-2xl bg-slate-800 border-2 border-slate-950 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                  </div>
              ))}
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 border-2 border-slate-950 flex items-center justify-center text-xs font-black text-white">
                  +1
              </div>
          </div>
          <button className="h-12 px-6 bg-white text-black font-black rounded-2xl hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto pb-6 custom-scrollbar min-h-0">
          {board.columns.map((column: any) => (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-6">
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-white text-xs uppercase tracking-widest">{column.title}</h3>
                  <span className="w-5 h-5 bg-slate-900 border border-slate-800 text-slate-500 text-[10px] flex items-center justify-center rounded-lg font-black">
                    {column.tasks.length}
                  </span>
                </div>
                <button className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-900">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "flex-1 flex flex-col gap-4 p-3 rounded-[32px] border-2 border-transparent transition-all duration-300 min-h-[200px]",
                      snapshot.isDraggingOver ? "bg-indigo-500/5 border-indigo-500/20" : "bg-slate-900/30"
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
                              "bg-slate-900/80 backdrop-blur-sm border border-white/[0.05] p-5 rounded-3xl shadow-xl cursor-grab active:cursor-grabbing hover:border-indigo-500/40 transition-all group",
                              snapshot.isDragging ? "shadow-2xl shadow-indigo-500/30 rotate-2 border-indigo-500 bg-slate-900 scale-105 z-50" : ""
                            )}
                          >
                            <div className="flex justify-between items-start mb-4">
                                <span className={cn(
                                    "px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase",
                                    task.priority === "HIGH" ? "bg-red-500/10 text-red-500" :
                                    task.priority === "MEDIUM" ? "bg-yellow-500/10 text-yellow-500" :
                                    "bg-emerald-500/10 text-emerald-500"
                                )}>
                                    {task.priority}
                                </span>
                                <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-[9px] font-black text-indigo-400 group-hover:scale-110 transition-transform">
                                    {task.assignee?.name?.[0].toUpperCase() || "?"}
                                </div>
                            </div>
                            <h4 className="font-black text-white text-sm mb-2 group-hover:text-indigo-400 transition-colors leading-tight">{task.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-5 leading-relaxed font-medium">
                                {task.description || "No specific details provided for this task yet."}
                            </p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold tracking-tight">2</span>
                                    </div>
                                    {task.dueDate && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold tracking-tight">Nov 24</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex -space-x-1.5">
                                   <div className="w-5 h-5 rounded-full bg-indigo-500 border border-slate-900" />
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
                      className="group flex items-center gap-3 px-5 py-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 border border-dashed border-slate-800 hover:border-white/20 transition-all text-xs font-black uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                      <span>New Task</span>
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
