import "../styles/ContactForm.css";

export default function ContactForm() {
  return (
    <section className="section contact-section">
      <h2>Contact Us</h2>
      <p>Have a custom order or question? Send us a message.</p>

      <form className="contact-form">
        <input type="text" placeholder="Your name" />
        <input type="email" placeholder="Your email" />
        <textarea rows="5" placeholder="Your message" />
        <button type="submit" className="btn">Send Message</button>
      </form>
    </section>
  );
}
