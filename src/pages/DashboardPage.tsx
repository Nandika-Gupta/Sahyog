import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "../services/api.ts";
import { Link } from "react-router-dom";
import { Plus, Users, Folder, ChevronRight, Layout } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newBoardTitle, setNewBoardTitle] = useState("");

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => fetcher("/workspaces"),
  });

  const createWorkspace = useMutation({
    mutationFn: (name: string) => fetcher("/workspaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setIsModalOpen(false);
      setNewWorkspaceName("");
    }
  });

  const handleCreateBoard = useMutation({
    mutationFn: ({ workspaceId, title }: { workspaceId: string; title: string }) => 
      fetcher(`/workspaces/${workspaceId}/boards`, {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setIsBoardModalOpen(false);
      setNewBoardTitle("");
      setActiveWorkspaceId(null);
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Your Workspaces
          </h1>
          <p className="text-slate-400">Collaborate and manage projects across teams</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>New Workspace</span>
        </button>
      </div>

      <div className="grid gap-8">
        {workspaces?.map((workspace: any) => (
          <div key={workspace.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-indigo-400">
                  <Folder className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">{workspace.name}</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="w-3 h-3" />
                    <span>{workspace.members.length} members</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setActiveWorkspaceId(workspace.id);
                  setIsBoardModalOpen(true);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Board</span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {workspace.boards?.length > 0 ? (
                workspace.boards.map((board: any) => (
                  <Link
                    key={board.id}
                    to={`/board/${board.id}`}
                    className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 p-6 rounded-xl transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <ChevronRight className="w-5 h-5 text-indigo-400" />
                    </div>
                    <Layout className="w-8 h-8 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-slate-100 mb-1">{board.title}</h3>
                    <p className="text-xs text-slate-500">Updated recently</p>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                   <p>No boards yet in this workspace</p>
                   <button 
                    onClick={() => {
                      setActiveWorkspaceId(workspace.id);
                      setIsBoardModalOpen(true);
                    }}
                    className="mt-4 text-indigo-400 hover:text-indigo-300 font-medium"
                   >
                     Create your first board
                   </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Workspace Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Create Workspace</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Workspace Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. Design Team, Startup Project"
                  />
                </div>
                <button
                  onClick={() => createWorkspace.mutate(newWorkspaceName)}
                  disabled={!newWorkspaceName || createWorkspace.isPending}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Board Modal */}
      <AnimatePresence>
        {isBoardModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => {
                  setIsBoardModalOpen(false);
                  setActiveWorkspaceId(null);
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Create New Board</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Board Title</label>
                  <input
                    autoFocus
                    type="text"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. Q2 Roadmap, Sprint 1"
                  />
                </div>
                <button
                  onClick={() => handleCreateBoard.mutate({ workspaceId: activeWorkspaceId!, title: newBoardTitle })}
                  disabled={!newBoardTitle || handleCreateBoard.isPending}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  {handleCreateBoard.isPending ? "Creating..." : "Create Board"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
