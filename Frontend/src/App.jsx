import { useEffect } from "react"
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom"
import Navbar from "./components/Navbar"
import CategoryNav from "./components/CategoryNav"
import Hero from "./components/Hero"
import Categories from "./components/Categories"
import AboutUs from "./components/AboutUs"
import HomeBanner from "./components/HomeBanner"
import Collections from "./components/Collections"
import DiscountShowcase from "./components/DiscountShowcase"
import Products from "./components/Products"
import ContactForm from "./components/ContactForm"
import Footer from "./components/Footer"
import FloatingWhatsApp from "./components/FloatingWhatsApp"
import CinematicIntro from "./components/CinematicIntro"
import Shop from "./components/shop"
import Cart from "./components/Cart"
import Profile from "./pages/Profile"
import ProductDetail from "./pages/ProductDetail"
import AdminPortal from "./admin/AdminPortal"
import { findCategoryBySlug } from "./utils/menuData"
import "./styles/Global.css"
import "./styles/Home.css"

function AdminEditProductRoute() {
  const { id = "" } = useParams();
  const productId = String(id).trim();
  return <AdminPortal currentPage="edit-product" currentProductId={productId} />;
}

function PublicSite({ page }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = page === "shop" || page === "product"
    ? "shop"
    : page === "cart"
    ? "cart"
    : page === "profile"
    ? "profile"
    : "home";
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

  useEffect(() => {
    if (page !== "home") {
      return undefined;
    }

    const revealTargets = document.querySelectorAll(
      ".collections-showcase, .categories, .collections-section, .collection-card, .discount-showcase, .discount-card, .best-sellers-section, .product, .about-us, .home-banner, .contact-section"
    );

    revealTargets.forEach((target, index) => {
      target.classList.add("scroll-reveal");
      target.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealTargets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      revealTargets.forEach((target) => {
        target.classList.remove("scroll-reveal", "scroll-visible");
        target.style.removeProperty("--reveal-delay");
      });
    };
  }, [page]);

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
      {page === "home" && <CinematicIntro />}
      <Navbar activePage={activePage} onNavigate={handleNavigate}/>
      <CategoryNav onNavigate={handleNavigate}/>
      {page === "shop" ? (
        <Shop selectedCategory={selectedCategory} />
      ) : page === "product" ? (
        <ProductDetail />
      ) : page === "profile" ? (
        <Profile />
      ) : page === "cart" ? (
        <Cart />
      ) : (
        <>
          <Hero/>
          <section className="collections-showcase">
            <Categories/>
            <Collections/>
            <DiscountShowcase/>
          </section>
          <Products/>
          <AboutUs/>
          <HomeBanner/>
          <ContactForm/>
        </>
      )}
      <FloatingWhatsApp/>
      <Footer/>
    </>
  );
}

function App(){
  return(
    <Routes>
      <Route path="/" element={<PublicSite page="home" />} />
      <Route path="/shop" element={<PublicSite page="shop" />} />
      <Route path="/product/:id" element={<PublicSite page="product" />} />
      <Route path="/cart" element={<PublicSite page="cart" />} />
      <Route path="/profile" element={<PublicSite page="profile" />} />

      <Route path="/admin" element={<AdminPortal currentPage="login" />} />
      <Route path="/admin/login" element={<AdminPortal currentPage="login" />} />
      <Route path="/admin/dashboard" element={<AdminPortal currentPage="dashboard" />} />
      <Route path="/admin/products" element={<AdminPortal currentPage="products" />} />
      <Route path="/admin/products/new" element={<AdminPortal currentPage="add-product" />} />
      <Route path="/admin/products/:id/edit" element={<AdminEditProductRoute />} />
      <Route path="/admin/orders" element={<AdminPortal currentPage="orders" />} />
      <Route path="/admin/users" element={<AdminPortal currentPage="users" />} />
      <Route path="/admin/messages" element={<AdminPortal currentPage="messages" />} />
      <Route path="/admin/discounts" element={<AdminPortal currentPage="discounts" />} />
      <Route path="/admin/collections" element={<AdminPortal currentPage="collections" />} />
      <Route path="/admin/site-images" element={<AdminPortal currentPage="site-images" />} />
      <Route path="/admin/*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
