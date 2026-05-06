import { FaWhatsapp } from "react-icons/fa";
import "../styles/FloatingWhatsApp.css";

const WHATSAPP_URL = "https://wa.me/917070759111";

export default function FloatingWhatsApp() {
  return (
    <a
      className="floating-whatsapp"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp at +91 70707 59111"
      title="Chat on WhatsApp"
    >
      <FaWhatsapp aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  );
}
