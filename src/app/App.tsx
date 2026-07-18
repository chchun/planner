import { useEffect } from "react";
import { AppShell } from "./AppShell";
import { RegisterModal } from "../components/RegisterModal";
import { useAppStore } from "../store/useAppStore";
import { Login } from "../screens/Login";
import { Dashboard } from "../screens/Dashboard";
import { Planner } from "../screens/Planner";
import { Timer } from "../screens/Timer";
import { Calendar } from "../screens/Calendar";
import { MemoBoard } from "../screens/Memo";

export function App() {
  const status = useAppStore((s) => s.status);
  const activeTab = useAppStore((s) => s.activeTab);
  const initialize = useAppStore((s) => s.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-bold text-slate-400">
        불러오는 중…
      </div>
    );
  }
  if (status === "login") return <Login />;

  return (
    <AppShell>
      {activeTab === "dashboard" && <Dashboard />}
      {activeTab === "planner" && <Planner />}
      {activeTab === "timer" && <Timer />}
      {activeTab === "calendar" && <Calendar />}
      {activeTab === "memo" && <MemoBoard />}
      <RegisterModal />
    </AppShell>
  );
}
