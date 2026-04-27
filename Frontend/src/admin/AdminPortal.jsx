import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import Orders from "./pages/Orders";
import Messages from "./pages/Messages";
import OurCollections from "./pages/OurCollections";
import { adminAuthService } from "./services/authService";

const pageMeta = {
  login: {
    title: "Login",
    subtitle: "Sign in to manage your store."
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "A quick overview of store activity and website performance."
  },
  products: {
    title: "Products",
    subtitle: "Manage product listings, pricing, stock, and visibility."
  },
  "add-product": {
    title: "Add Product",
    subtitle: "Create and publish a new storefront product."
  },
  "edit-product": {
    title: "Edit Product",
    subtitle: "Update product details, image, and availability."
  },
  orders: {
    title: "Orders",
    subtitle: "Track order status and manage fulfillment workflow."
  },
  messages: {
    title: "Messages",
    subtitle: "Review and manage customer contact messages."
  },
  collections: {
    title: "Our Collections",
    subtitle: "View highlighted collection sections shown on storefront."
  }
};

export default function AdminPortal({ currentPage = "dashboard", currentProductId = "" }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminAuthService.isAuthenticated());

  function goTo(page, id = "") {
    const routeMap = {
      login: "/admin/login",
      dashboard: "/admin/dashboard",
      products: "/admin/products",
      "add-product": "/admin/products/new",
      orders: "/admin/orders",
      messages: "/admin/messages",
      collections: "/admin/collections"
    };

    if (page === "edit-product" && id) {
      navigate(`/admin/products/${id}/edit`);
      return;
    }

    navigate(routeMap[page] ?? "/admin/dashboard");
  }

  let page = null;

  switch (currentPage) {
    case "login":
      page = null;
      break;
    case "products":
      page = <Products onNavigate={goTo} />;
      break;
    case "add-product":
      page = <AddProduct onNavigate={goTo} />;
      break;
    case "edit-product":
      page = <EditProduct productId={currentProductId} onNavigate={goTo} />;
      break;
    case "orders":
      page = <Orders onNavigate={goTo} />;
      break;
    case "messages":
      page = <Messages onNavigate={goTo} />;
      break;
    case "collections":
      page = <OurCollections onNavigate={goTo} />;
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
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && isAuthenticated) {
        // Auto logout if admin moves out
        adminAuthService.logout();
        setIsAuthenticated(false);
        navigate("/admin/login", { replace: true });
      }
    }

    let idleTimeout;
    function resetIdle() {
      clearTimeout(idleTimeout);
      if (isAuthenticated) {
        // 10 minutes idle timeout fallback
        idleTimeout = setTimeout(() => {
          adminAuthService.logout();
          setIsAuthenticated(false);
          navigate("/admin/login", { replace: true });
        }, 10 * 60 * 1000);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    // document.addEventListener("mousemove", resetIdle);
    // document.addEventListener("keydown", resetIdle);
    resetIdle();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // document.removeEventListener("mousemove", resetIdle);
      // document.removeEventListener("keydown", resetIdle);
      clearTimeout(idleTimeout);
    };
  }, [isAuthenticated, navigate]);

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
