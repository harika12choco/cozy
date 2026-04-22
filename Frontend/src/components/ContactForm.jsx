import { useState } from "react";
import { messageStore } from "../services/messageStore";
import "../styles/ContactForm.css";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
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
      message: formData.message.trim()
    };

    if (!nextData.name || !nextData.email || !nextData.message) {
      setFeedback("Please fill in your name, email, and message.");
      return;
    }

    if (nextData.name.length > 20) {
      setFeedback("Name must be 20 characters or fewer.");
      return;
    }

    try {
      setSubmitting(true);
      await messageStore.create(nextData);
      setFormData({
        name: "",
        email: "",
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
    </section>
  );
}
