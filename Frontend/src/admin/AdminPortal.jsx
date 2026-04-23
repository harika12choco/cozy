import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { adminAuthService } from "./services/authService";

const pageMeta = {
  login: {
    title: "Login",
    subtitle: "Sign in to manage your store."
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "A quick overview of store activity and website performance."
  }
};

export default function AdminPortal({ currentPage = "dashboard" }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminAuthService.isAuthenticated());

  function goTo(page) {
    const routeMap = {
      login: "/admin/login",
      dashboard: "/admin/dashboard"
    };

    navigate(routeMap[page] ?? "/admin/dashboard");
  }

  let page = null;

  switch (currentPage) {
    case "login":
      page = null;
      break;
    case "dashboard":
    default:
      page = <Dashboard onNavigate={goTo} />;
      break;
  }

  if (currentPage === "login") {
    if (isAuthenticated) {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return (
      <Login
        onLogin={async ({ username, password }) => {
          try {
            await adminAuthService.login({ username, password });
            setIsAuthenticated(true);
            navigate("/admin/dashboard", { replace: true });
            return { error: "" };
          } catch (error) {
            return {
              error: error.message || "Invalid username or password."
            };
          }
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminLayout
      currentPage={currentPage}
      onNavigate={goTo}
      onLogout={() => {
        adminAuthService.logout();
        setIsAuthenticated(false);
        navigate("/admin/login", { replace: true });
      }}
      title={pageMeta[currentPage]?.title ?? "Admin"}
      subtitle={pageMeta[currentPage]?.subtitle ?? ""}
    >
      {page}
    </AdminLayout>
  );
}
