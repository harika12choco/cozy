import { useEffect } from "react"
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import Categories from "./components/Categories"
import AboutUs from "./components/AboutUs"
import Collections from "./components/Collections"
import Products from "./components/Products"
import ContactForm from "./components/ContactForm"
import Footer from "./components/Footer"
import Shop from "./components/shop"
import Cart from "./components/Cart"
import AdminPortal from "./admin/AdminPortal"
import { findCategoryBySlug } from "./utils/menuData"
import "./styles/Global.css"
import "./styles/Home.css"

function PublicSite({ page }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = page === "shop" ? "shop" : page === "cart" ? "cart" : "home";
  const selectedCategory = page === "shop"
    ? findCategoryBySlug(new URLSearchParams(location.search).get("category") ?? "")?.value ?? ""
    : "";

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, [location]);

  function handleNavigate(destination) {
    const sectionMap = {
      collections: "#collections",
      about: "#about",
      contact: "#contact"
    };

    if (destination === "shop") {
      navigate("/shop");
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    if (destination === "home") {
      navigate("/");
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    if (destination === "cart") {
      navigate("/cart");
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    if (typeof destination === "object" && destination?.type === "category") {
      navigate(`/shop?category=${destination.slug}`);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    navigate(`/${sectionMap[destination]}`);
  }

  return (
    <>
      <Navbar activePage={activePage} onNavigate={handleNavigate}/>
      {page === "shop" ? (
        <Shop selectedCategory={selectedCategory} />
      ) : page === "cart" ? (
        <Cart />
      ) : (
        <>
          <Hero/>
          <section className="collections-showcase">
            <Categories/>
            <Collections/>
          </section>
          <Products/>
          <AboutUs/>
          <ContactForm/>
        </>
      )}
      <Footer/>
    </>
  );
}

function App(){
  return(
    <Routes>
      <Route path="/" element={<PublicSite page="home" />} />
      <Route path="/shop" element={<PublicSite page="shop" />} />
      <Route path="/cart" element={<PublicSite page="cart" />} />

      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminPortal currentPage="login" />} />
      <Route path="/admin/dashboard" element={<AdminPortal currentPage="dashboard" />} />
      <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  )
}

export default App
