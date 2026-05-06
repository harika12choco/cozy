import { useState } from "react";
import { messageStore } from "../services/messageStore";
import "../styles/ContactForm.css";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "phone") {
      const numericValue = value.replace(/[^0-9]/g, "").slice(0, 10);
      setFormData((current) => ({
        ...current,
        [name]: numericValue
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      message: formData.message.trim()
    };

    if (!nextData.name || !nextData.email || !nextData.phone || !nextData.message) {
      setFeedback("Please fill in your name, email, phone number, and message.");
      return;
    }

    if (nextData.name.length > 20) {
      setFeedback("Name must be 20 characters or fewer.");
      return;
    }

    if (!/^[6-9][0-9]{9}$/.test(nextData.phone)) {
      setFeedback("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setSubmitting(true);
      await messageStore.create(nextData);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
      setFeedback("Your message has been sent. We will get back to you soon.");
    } catch (error) {
      setFeedback(error.message || "We could not send your message right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="contact" className="section contact-section">
      <h2>Contact Us</h2>
      <p>Have a custom order or question? Send us a message.</p>

      <div className="contact-content">
        <aside className="contact-details" aria-label="Store contact details">
          <h3>Reach us at:</h3>
          <div>
            <span>Address</span>
            <strong>Patna, Bihar</strong>
          </div>
          <div>
            <span>Phone</span>
            <a href="tel:+917070759111">7070759111</a>
          </div>
          <div>
            <span>Email</span>
            <a href="mailto:cozycandlebyakanksha@gmail.com">cozycandlebyakanksha@gmail.com</a>
          </div>
        </aside>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            maxLength="20"
          />
          <input
            type="email"
            name="email"
            placeholder="Your email"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="tel"
            name="phone"
            placeholder="Your mobile number"
            value={formData.phone}
            onChange={handleChange}
            onInput={(event) => {
              event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, "").slice(0, 10);
            }}
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            title="Please enter a valid 10-digit mobile number."
          />
          {formData.phone && !/^[6-9][0-9]{9}$/.test(formData.phone) ? (
            <p className="contact-form-feedback">Please enter a valid 10-digit mobile number.</p>
          ) : null}
          <textarea
            rows="5"
            name="message"
            placeholder="Your message"
            value={formData.message}
            onChange={handleChange}
          />
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "Sending..." : "Send Message"}
          </button>
          {feedback ? <p className="contact-form-feedback">{feedback}</p> : null}
        </form>
      </div>
    </section>
  );
}
