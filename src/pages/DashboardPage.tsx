import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "../services/api.ts";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Users, Layout, MoreVertical, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "../stores/auth.ts";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
    },
    onError: (err: Error) => setError(err.message)
  });

  const handleCreateBoard = useMutation({
    mutationFn: ({ workspaceId, title }: { workspaceId: string; title: string }) => 
      fetcher(`/workspaces/${workspaceId}/boards`, {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setIsBoardModalOpen(false);
      setNewBoardTitle("");
      setActiveWorkspaceId(null);
      setError(null);
      navigate(`/board/${data.id}`);
    },
    onError: (err: Error) => setError(err.message)
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-slate-400 font-medium">
            Here's what's happening across your team workspaces.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black font-black rounded-2xl hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Workspace</span>
        </button>
      </div>

      {/* Grid of Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces?.map((workspace: any) => (
          <motion.div
            key={workspace.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-8 hover:bg-slate-900/60 transition-all hover:border-indigo-500/30 overflow-hidden"
          >
             <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-black text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
                  {workspace.name[0]}
                </div>
                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
             </div>

             <div className="mb-8">
                <h3 className="text-2xl font-black text-white mb-2">{workspace.name}</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <Users className="w-3.5 h-3.5" />
                    <span>{workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-1 h-1 bg-slate-800 rounded-full" />
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <Layout className="w-3.5 h-3.5" />
                    <span>{workspace.boards?.length || 0} boards</span>
                  </div>
                </div>
             </div>

             <div className="space-y-3">
                {workspace.boards?.slice(0, 3).map((board: any) => (
                  <Link
                    key={board.id}
                    to={`/board/${board.id}`}
                    className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/[0.02] hover:bg-indigo-600 transition-all group/board"
                  >
                    <span className="text-sm font-bold text-slate-300 group-hover/board:text-white">{board.title}</span>
                    <Plus className="w-4 h-4 text-slate-700 group-hover/board:text-white" />
                  </Link>
                ))}
                
                <button
                  onClick={() => {
                    setActiveWorkspaceId(workspace.id);
                    setIsBoardModalOpen(true);
                  }}
                  className="w-full py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 border-2 border-dashed border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Board
                </button>
             </div>
          </motion.div>
        ))}
        
        {workspaces?.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 text-slate-700">
               <Settings className="w-10 h-10 animate-[spin_8s_linear_infinite]" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">No workspaces yet</h3>
            <p className="text-slate-500 mb-8 max-w-sm">
              Create your first team workspace to start collaborating and managing your projects.
            </p>
            <button
               onClick={() => setIsModalOpen(true)}
               className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-500/30 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Workspace
            </button>
          </div>
        )}
      </div>

      {/* Workspace Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 p-10 rounded-[40px] shadow-2xl shadow-black"
            >
              <h2 className="text-3xl font-black text-white mb-2">New Workspace</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">Give your team a space to thrive.</p>
              
              {error && <p className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl mb-6">{error}</p>}
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Workspace Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl px-5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold placeholder:text-slate-700"
                    placeholder="e.g. Design Team ⚡️"
                  />
                </div>
                <button
                  onClick={() => createWorkspace.mutate(newWorkspaceName)}
                  disabled={!newWorkspaceName || createWorkspace.isPending}
                  className="w-full h-14 bg-white text-black hover:bg-slate-200 disabled:opacity-50 font-black rounded-2xl transition-all shadow-xl shadow-white/5"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
              onClick={() => {
                  setIsBoardModalOpen(false);
                  setActiveWorkspaceId(null);
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 p-10 rounded-[40px] shadow-2xl shadow-black"
            >
              <h2 className="text-3xl font-black text-white mb-2">New Board</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">A fresh canvas for your next big idea.</p>
              
              {error && <p className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl mb-6">{error}</p>}
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Board Title</label>
                  <input
                    autoFocus
                    type="text"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    className="w-full h-14 bg-slate-950 border border-slate-800 rounded-2xl px-5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold placeholder:text-slate-700"
                    placeholder="e.g. Q2 Roadmap"
                  />
                </div>
                <button
                  onClick={() => handleCreateBoard.mutate({ workspaceId: activeWorkspaceId!, title: newBoardTitle })}
                  disabled={!newBoardTitle || handleCreateBoard.isPending}
                  className="w-full h-14 bg-white text-black hover:bg-slate-200 disabled:opacity-50 font-black rounded-2xl transition-all shadow-xl shadow-white/5"
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
