import { useEffect } from "react"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import Categories from "./components/Categories"
import AboutUs from "./components/AboutUs"
import Collections from "./components/Collections"
import Products from "./components/Products"
import ContactForm from "./components/ContactForm"
import Footer from "./components/Footer"
import "./styles/global.css"

function App(){
useEffect(() => {
  const targets = document.querySelectorAll(
    "section, .category-card, .card, .product, .about-left, .about-right, .contact-form, .footer-container, .footer-bottom"
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -60px 0px",
    }
  );

  targets.forEach((el, index) => {
    el.classList.add("reveal-on-scroll");
    el.style.setProperty("--reveal-delay", `${(index % 6) * 70}ms`);
    observer.observe(el);
  });

  return () => observer.disconnect();
}, []);

return(

<>
<Navbar/>
<Hero/>
<Categories/>
<Collections/>
<Products/>
<AboutUs/>
<ContactForm/>
<Footer/>
</>

)

}

export default App
