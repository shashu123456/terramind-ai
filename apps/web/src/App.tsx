import { Redirect, Route, Switch } from "wouter";
import { Brand } from "@terramind/ui";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import AppShell from "./components/layout/AppShell";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Baseline from "./pages/Baseline";
import Interventions from "./pages/Interventions";
import Scenarios from "./pages/Scenarios";
import Copilot from "./pages/Copilot";
import Trace from "./pages/Trace";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <Brand />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-brand-100">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-ibm-blue" />
        </div>
      </div>
    </div>
  );
}

function Gate() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Login />;

  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/baseline" component={Baseline} />
        <Route path="/interventions" component={Interventions} />
        <Route path="/scenarios" component={Scenarios} />
        <Route path="/copilot" component={Copilot} />
        <Route path="/traces" component={Trace} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/login" component={() => <Redirect to="/" />} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" switchable>
      <Gate />
    </ThemeProvider>
  );
}