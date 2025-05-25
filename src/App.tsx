import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "sonner";
import UserNavbar from "@/components/UserNavbar";
import "./App.css";
// Supports weights 100-900
import "@fontsource-variable/inter";

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Check if we're on an authentication page or dashboard
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";
  const isDashboardPage =
    location.pathname === "/" || location.pathname === "/dashboard";

  // Only show UserNavbar if not on auth pages or dashboard
  const shouldShowNavbar = !isAuthPage && !isDashboardPage && user && !loading;

  return (
    <div className="min-w-screen min-h-screen bg-background text-foreground font-sans dark:bg-background">
      <div className="flex h-screen">
        {shouldShowNavbar && <UserNavbar />}
        <main className={`flex-1 ${!isAuthPage ? "flex items-stretch" : ""}`}>
          <Outlet />
        </main>
      </div>
      <Toaster
        position="top-right"
        theme="system"
        toastOptions={{
          className: "dark:bg-card dark:text-card-foreground",
        }}
      />
    </div>
  );
}

export default App;
