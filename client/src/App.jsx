import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import { ApplicationsProvider } from "./context/ApplicationsContext";
import AppShell from "./components/AppShell";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ApplicationForm from "./pages/ApplicationForm";
import ApplicationDetail from "./pages/ApplicationDetail";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";

const Splash = () => (
  <div className="grid min-h-screen place-items-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
  </div>
);

// Signed-in area: waits for the session check, then loads the applications once.
const PrivateArea = () => {
  const { user } = useAuth();
  if (user === undefined) return <Splash />;
  if (user === null) return <Navigate to="/login" replace />;
  return (
    <ApplicationsProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </ApplicationsProvider>
  );
};

// Landing, login and register send signed-in visitors straight to the app.
const PublicOnly = () => {
  const { user } = useAuth();
  const { search } = useLocation();
  if (user === undefined) return <Splash />;
  // A shared link like /?demo=1&view=insights lands on that page after sign-in.
  const target = new URLSearchParams(search).get("view") === "insights" ? "/app/insights" : "/app";
  return user ? <Navigate to={target} replace /> : <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "rgb(var(--ink))",
            color: "rgb(var(--bg))",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
        </Route>
        <Route path="/app" element={<PrivateArea />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<ApplicationForm />} />
          <Route path="a/:id" element={<ApplicationDetail />} />
          <Route path="a/:id/edit" element={<ApplicationForm />} />
          <Route path="insights" element={<Insights />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
