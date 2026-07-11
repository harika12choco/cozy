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
import OurProducts from "./components/OurProducts"
import Products from "./components/Products"
import CustomCandle from "./components/CustomCandle"
import Reviews from "./components/Reviews"
import ContactForm from "./components/ContactForm"
import Footer from "./components/Footer"
import FloatingWhatsApp from "./components/FloatingWhatsApp"
import CinematicIntro from "./components/CinematicIntro"
import Shop from "./components/shop"
import Cart from "./components/Cart"
import Profile from "./pages/Profile"
import ProductDetail from "./pages/ProductDetail"
import PolicyPage from "./pages/PolicyPage"
import OrderSuccess from "./pages/OrderSuccess"
import AdminPortal from "./admin/AdminPortal"
import { findCategoryBySlug } from "./utils/menuData"
import "./styles/Global.css"
import "./styles/Home.css"

function AdminEditProductRoute() {
  const { id = "" } = useParams();
  const productId = String(id).trim();
  return <AdminPortal currentPage="edit-product" currentProductId={productId} />;
}

function PublicSite({ page, policySlug }) {
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
    if (page === "policy") {
      return;
    }

    const pageTitles = {
      home: "Cozy Candle | Handcrafted Candles",
      shop: "Shop | Cozy Candle",
      product: "Product | Cozy Candle",
      cart: "Cart | Cozy Candle",
      profile: "Login & Account | Cozy Candle"
    };

    document.title = pageTitles[page] ?? "Cozy Candle";
  }, [page]);

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
      ".collections-showcase, .categories, .our-products-section, .collections-section, .collection-card, .discount-showcase, .discount-card, .product, .custom-candle, .about-us, .home-story, .reviews-section, .review-card, .contact-section"
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
      ) : page === "policy" ? (
        <PolicyPage policySlug={policySlug} />
      ) : (
        <>
          <Hero/>
          <section className="collections-showcase">
            <Categories/>
            <OurProducts/>
            <Collections/>
            <DiscountShowcase/>
          </section>
          <Products/>
          <CustomCandle/>
          <AboutUs/>
          <HomeBanner/>
          <Reviews/>
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
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/profile" element={<PublicSite page="profile" />} />
      <Route path="/privacy-policy" element={<PublicSite page="policy" policySlug="privacy-policy" />} />
      <Route path="/refund-return-policy" element={<PublicSite page="policy" policySlug="refund-return-policy" />} />
      <Route path="/terms-conditions" element={<PublicSite page="policy" policySlug="terms-conditions" />} />
      <Route path="/shipping-delivery-policy" element={<PublicSite page="policy" policySlug="shipping-delivery-policy" />} />

      <Route path="/admin" element={<AdminPortal currentPage="login" />} />
      <Route path="/admin/login" element={<AdminPortal currentPage="login" />} />
      <Route path="/admin/dashboard" element={<AdminPortal currentPage="dashboard" />} />
      <Route path="/admin/products" element={<AdminPortal currentPage="products" />} />
      <Route path="/admin/products/new" element={<AdminPortal currentPage="add-product" />} />
      <Route path="/admin/products/:id/edit" element={<AdminEditProductRoute />} />
      <Route path="/admin/orders" element={<AdminPortal currentPage="orders" />} />
      <Route path="/admin/users" element={<AdminPortal currentPage="users" />} />
      <Route path="/admin/messages" element={<AdminPortal currentPage="messages" />} />
      <Route path="/admin/candle-colors" element={<AdminPortal currentPage="candle-colors" />} />
      <Route path="/admin/fragrances" element={<AdminPortal currentPage="fragrances" />} />
      <Route path="/admin/discounts" element={<AdminPortal currentPage="discounts" />} />
      <Route path="/admin/collections" element={<AdminPortal currentPage="collections" />} />
      <Route path="/admin/site-images" element={<AdminPortal currentPage="site-images" />} />
      <Route path="/admin/*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
