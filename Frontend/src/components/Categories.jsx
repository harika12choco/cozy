import "../styles/Categories.css"
import { useNavigate } from "react-router-dom";

export default function Categories(){
const navigate = useNavigate();

function handleNavigate(destination) {
if (destination === "shop") {
navigate("/shop");
window.scrollTo({ top: 0, behavior: "auto" });
return;
}

navigate(`/#${destination}`);
}

return(

<section className="categories">

<div className="category-card" onClick={() => handleNavigate("shop")} role="button" tabIndex={0} onKeyDown={(event) => {
if (event.key === "Enter" || event.key === " ") {
event.preventDefault();
handleNavigate("shop");
}
}}>
<span>Shop all</span>
</div>

<div className="category-card" onClick={() => handleNavigate("collections")} role="button" tabIndex={0} onKeyDown={(event) => {
if (event.key === "Enter" || event.key === " ") {
event.preventDefault();
handleNavigate("collections");
}
}}>
<span>Collections</span>
</div>

<div className="category-card" onClick={() => handleNavigate("bestsellers")} role="button" tabIndex={0} onKeyDown={(event) => {
if (event.key === "Enter" || event.key === " ") {
event.preventDefault();
handleNavigate("bestsellers");
}
}}>
<span>Most loved</span>
</div>

<div className="category-card" onClick={() => handleNavigate("contact")} role="button" tabIndex={0} onKeyDown={(event) => {
if (event.key === "Enter" || event.key === " ") {
event.preventDefault();
handleNavigate("contact");
}
}}>
<span>Message us</span>
</div>

</section>

)

}
