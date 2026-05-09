import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Layout, Zap, Layers, Shield, ChevronRight, Users } from "lucide-react";
import { useAuthStore } from "../stores/auth.ts";

export default function LandingPage() {
  const token = useAuthStore((state) => state.token);

  return (
    <div className="bg-slate-950 text-slate-50 min-h-screen selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span>Sahyog</span>
          </div>
          
          <div className="flex items-center gap-6">
            {!token && (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  Get Started
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
            {token && (
              <Link 
                to="/dashboard" 
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-full hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8">
                Team Collaboration <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 italic">
                  Perfected.
                </span>
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                Sahyog is the minimal, event-driven collaboration platform built for student teams and agile project groups. Experience task management without the noise.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to={token ? "/dashboard" : "/signup"}
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-indigo-500/40 text-lg flex items-center justify-center gap-2 group"
                >
                  Get Started for Free
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 text-slate-300">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center overflow-hidden">
                        <img 
                          src={`https://i.pravatar.cc/100?img=${i + 10}`} 
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-medium">1,200+ teams collaborating</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-4 bg-black/20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-indigo-400" />}
              title="Real-time Sync"
              description="Live board updates that keep everyone on the same page instantly. Built with event-driven architecture."
            />
            <FeatureCard 
              icon={<Layers className="w-6 h-6 text-purple-400" />}
              title="Kanban Mastery"
              description="Visual boards that make progress tracking effortless and clear. Drag, drop, and conquer."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-emerald-400" />}
              title="Secure by Design"
              description="Granular permissions ensuring your project data stays private and safe. Enterprise-grade security."
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:row items-center justify-between gap-8">
            <div className="flex items-center gap-2 text-slate-400 font-bold">
              <Layers className="w-5 h-5" />
              <span>Sahyog</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 Sahyog Inc. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all group"
    >
      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}
