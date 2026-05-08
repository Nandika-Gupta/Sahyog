import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.ts";
import { LogOut, Layout, Bell, User, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "../services/api.ts";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
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
      // Optional: Play sound or show toast
    });
    return () => {
      socket.disconnect();
    };
  }, [user, queryClient]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-400">
          <Layout className="w-6 h-6" />
          <span>Sahyog</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-slate-400 hover:text-white transition-colors relative p-2 rounded-lg hover:bg-slate-800"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-slate-900" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowNotifications(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                      <span className="font-bold text-sm">Notifications</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Recent</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications?.length > 0 ? (
                        notifications.map((n: any) => (
                          <div key={n.id} className="p-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 transition-colors">
                            <h4 className="text-sm font-semibold text-indigo-400 mb-1">{n.title}</h4>
                            <p className="text-xs text-slate-300 mb-2 leading-relaxed">{n.message}</p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-500 text-sm italic">
                          No new notifications
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-medium">
                {user?.name?.[0].toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
