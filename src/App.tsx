import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/auth.ts";
import LoginPage from "./pages/LoginPage.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import BoardPage from "./pages/BoardPage.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import Header from "./components/Header.tsx";
import Sidebar from "./components/Sidebar.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {!token ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 ml-64 min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 p-8">
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/board/:boardId" element={<BoardPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
