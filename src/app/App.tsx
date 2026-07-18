import { AppShell } from "./AppShell";
import { RegisterModal } from "../components/RegisterModal";
import { useAppStore } from "../store/useAppStore";
import { Dashboard } from "../screens/Dashboard";
import { Planner } from "../screens/Planner";
import { Timer } from "../screens/Timer";
import { Calendar } from "../screens/Calendar";
import { MemoBoard } from "../screens/Memo";

export function App() {
  const activeTab = useAppStore((s) => s.activeTab);

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
