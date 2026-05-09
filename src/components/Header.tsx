import { Bell, Search, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "../services/api.ts";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "../stores/auth.ts";

export default function Header() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetcher("/auth/notifications"),
    enabled: !!user,
  });

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  useEffect(() => {
    if (!user) return;
    const socket = io();
    socket.on(`notification:${user.id}`, (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
    return () => {
      socket.disconnect();
    };
  }, [user, queryClient]);

  return (
    <header className="h-20 bg-slate-950/50 backdrop-blur-xl border-b border-slate-900 sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors relative rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-950" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <span className="font-bold text-sm">Notifications</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Recent</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications?.length > 0 ? (
                      notifications.map((n: any) => (
                        <div key={n.id} className="p-5 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 transition-colors">
                          <h4 className="text-sm font-bold text-white mb-1">{n.title}</h4>
                          <p className="text-xs text-slate-400 mb-2 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-600 font-medium">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center text-slate-600 text-sm italic">
                        No notifications yet
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button className="flex items-center gap-2 h-11 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Quick Action</span>
        </button>
      </div>
    </header>
  );
}
