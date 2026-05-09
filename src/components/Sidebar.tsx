import { Link, useLocation } from "react-router-dom";
import { 
  Layout, 
  Bell, 
  Settings, 
  Plus, 
  Users, 
  ChevronRight,
  LogOut,
  Search,
  Home,
  Briefcase
} from "lucide-react";
import { useAuthStore } from "../stores/auth.ts";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "../services/api.ts";

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => fetcher("/workspaces"),
    enabled: !!user,
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Brand */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3 text-xl font-black tracking-tight text-white">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <span>Sahyog</span>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          <SidebarItem 
            icon={<Home className="w-4 h-4" />} 
            label="Dashboard" 
            to="/dashboard" 
            active={isActive("/dashboard")} 
          />
          <SidebarItem 
            icon={<Bell className="w-4 h-4" />} 
            label="Notifications" 
            to="/notifications" 
            active={isActive("/notifications")} 
          />
          <SidebarItem 
            icon={<Settings className="w-4 h-4" />} 
            label="Settings" 
            to="/settings" 
            active={isActive("/settings")} 
          />
        </div>

        {/* Workspaces Section */}
        <div className="mt-8">
          <div className="px-3 mb-4 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Workspaces</span>
            <button className="text-slate-500 hover:text-white transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-1">
            {workspaces?.map((ws: any) => (
              <SidebarItem 
                key={ws.id}
                icon={<div className="w-4 h-4 bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-indigo-400">{ws.name[0]}</div>}
                label={ws.name}
                to={`/workspace/${ws.id}`}
                active={isActive(`/workspace/${ws.id}`)}
              />
            ))}
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-white hover:bg-slate-900 rounded-lg transition-all group">
              <Plus className="w-4 h-4" />
              <span>New Workspace</span>
            </button>
          </div>
        </div>
      </nav>

      {/* User Support/Profile Area */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-[2px]">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
               <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, to, active }: { icon: React.ReactNode, label: string, to: string, active: boolean }) {
  return (
    <Link 
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
        active 
          ? "bg-indigo-600/10 text-indigo-400" 
          : "text-slate-400 hover:text-white hover:bg-slate-900"
      }`}
    >
      <div className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
        {icon}
      </div>
      <span className="text-sm font-bold flex-1">{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
    </Link>
  );
}
