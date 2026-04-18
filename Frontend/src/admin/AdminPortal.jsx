import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import Orders from "./pages/Orders";
import Messages from "./pages/Messages";

const pageMeta = {
  login: {
    title: "Login",
    subtitle: "Sign in to manage your store."
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "A quick overview of store activity and editable website content."
  },
  products: {
    title: "Products",
    subtitle: "Manage the candle catalog shown across the storefront."
  },
  "add-product": {
    title: "Add Product",
    subtitle: "Create a new product entry for the website."
  },
  "edit-product": {
    title: "Edit Product",
    subtitle: "Update an existing product listing."
  },
  orders: {
    title: "Orders",
    subtitle: "Review purchases and keep order statuses updated."
  },
  messages: {
    title: "Messages",
    subtitle: "Read customer enquiries submitted through the website contact form."
  },
};

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "CozyCandle@12!";

export default function AdminPortal({ currentPage = "dashboard", productId = null }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  function goTo(page, id = null) {
    const routeMap = {
      login: "/admin/login",
      dashboard: "/admin/dashboard",
      products: "/admin/products",
      "add-product": "/admin/products/add",
      orders: "/admin/orders",
      messages: "/admin/messages"
    };

    if (page === "edit-product" && id) {
      navigate(`/admin/products/${id}/edit`);
      return;
    }

    navigate(routeMap[page] ?? "/admin/dashboard");
  }

  let page = null;

  switch (currentPage) {
    case "products":
      page = <Products onNavigate={goTo} />;
      break;
    case "add-product":
      page = <AddProduct onNavigate={goTo} />;
      break;
    case "edit-product":
      page = <EditProduct productId={productId} onNavigate={goTo} />;
      break;
    case "orders":
      page = <Orders />;
      break;
    case "messages":
      page = <Messages />;
      break;
    case "login":
      page = null;
      break;
    case "dashboard":
    default:
      page = <Dashboard onNavigate={goTo} />;
      break;
  }

  if (currentPage === "login") {
    return (
      <Login
        onLogin={({ username, password }) => {
          if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            return { error: "Invalid username or password." };
          }

          setIsAuthenticated(true);
          navigate("/admin/dashboard", { replace: true });
          return { error: "" };
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
