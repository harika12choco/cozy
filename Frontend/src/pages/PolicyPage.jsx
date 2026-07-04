import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import "../styles/PolicyPage.css";

const policies = {
  "privacy-policy": {
    title: "Privacy Policy",
    intro: "We value your privacy and are committed to protecting your personal information.",
    sections: [
      {
        heading: "Information We Collect",
        items: ["Name", "Email Address", "Phone Number", "Shipping/Billing Address", "Order Information"]
      },
      {
        heading: "How We Use Your Information",
        items: [
          "To process and fulfill orders",
          "To provide customer support",
          "To communicate order updates",
          "To improve our products and services"
        ]
      },
      {
        heading: "Data Protection",
        body: "Customer information is stored securely and is used only for order processing, customer support, and business operations."
      },
      {
        heading: "Third-Party Services",
        body: "Payments may be processed through secure third-party payment providers. We do not store sensitive payment information such as card details or banking credentials."
      }
    ]
  },
  "refund-return-policy": {
    title: "Refund & Return Policy",
    intro:
      "Due to the handmade and customized nature of our products, refunds are not available after purchase except for damaged, defective, or incorrect items.",
    sections: [
      {
        heading: "Return Eligibility",
        items: [
          "Return requests must be made within 48 hours of receiving the product.",
          "Returns are accepted only for defective, damaged, or incorrect products.",
          "An unedited unboxing video is mandatory for all return requests.",
          "The video must clearly show the sealed package being opened and the condition of the product.",
          "Edited, cut, or incomplete videos will not be accepted."
        ]
      },
      {
        heading: "How to Request a Return",
        body: "Please send the following details via Email or WhatsApp:",
        items: ["Order ID", "Contact Number", "Reason for Return", "Complete Unedited Unboxing Video"]
      },
      {
        heading: "Refund Process",
        items: [
          "Once the returned item is inspected and approved, the refund will be processed.",
          "Refunds will be issued within 6-10 business days through the original payment method."
        ]
      },
      {
        heading: "Non-Returnable Conditions",
        body: "Returns will not be accepted if:",
        items: [
          "The product shows signs of use or damage after delivery.",
          "No unboxing video is provided.",
          "The return request is made after 48 hours of delivery.",
          "The product is returned without valid proof of damage or incorrect delivery."
        ]
      },
      {
        heading: "Return Shipping Charges",
        items: [
          "For any other approved return reason, shipping charges will be the customer's responsibility."
        ]
      },
      {
        heading: "Return & Refund Queries",
        body: "For any return or refund-related queries, please contact us at:",
        lines: [
          {
            label: "Email",
            value: "cozycandlebyakanksha@gmail.com",
            href: "mailto:cozycandlebyakanksha@gmail.com"
          },
          {
            label: "WhatsApp",
            value: "+91 70707 59111",
            href: "https://wa.me/917070759111"
          }
        ]
      }
    ]
  },
  "terms-conditions": {
    title: "Terms & Conditions",
    sections: [
      {
        heading: "Products",
        body: "As our products are handmade, slight variations in color, texture, fragrance, and appearance may occur."
      },
      {
        heading: "Product Images",
        body: "Product colors may vary slightly due to screen settings, lighting, and photography."
      },
      {
        heading: "Pricing",
        body: "All prices are subject to change without prior notice."
      },
      {
        heading: "Order Acceptance",
        body: "Orders are considered confirmed only after successful payment confirmation."
      },
      {
        heading: "Customer Responsibility",
        body: "Customers are responsible for providing accurate shipping, billing, and contact information."
      },
      {
        heading: "Cancellation",
        body: "Orders can be cancelled only before dispatch. Once the order has been shipped, cancellation requests cannot be accepted."
      }
    ]
  },
  "shipping-delivery-policy": {
    title: "Shipping & Delivery Policy",
    sections: [
      {
        heading: "Dispatch Time",
        body: "Orders are dispatched within 2-3 business days after payment confirmation."
      },
      {
        heading: "Shipping Charges",
        items: [
          "Up to 1 kg - Rs. 150",
          "Up to 5 kg - Rs. 450",
          "Above 5 kg - Rs. 950",
          "Free Shipping on orders above Rs. 4,999"
        ]
      },
      {
        heading: "Delivery Timeline",
        body: "Delivery time varies depending on the customer's location and courier service availability."
      },
      {
        heading: "Courier Services",
        body: "Courier charges are fixed based on the order weight. Delivery timelines may vary depending on the distance between Patna and the delivery location."
      },
      {
        heading: "Address Accuracy",
        body: "Customers are responsible for providing accurate delivery details. We are not responsible for delays or failed deliveries due to incorrect address information."
      },
      {
        heading: "Delays",
        body: "We are not responsible for delays caused by courier partners, weather conditions, natural disasters, public holidays, or other unforeseen circumstances."
      }
    ]
  }
};

export default function PolicyPage({ policySlug }) {
  const policy = policies[policySlug];

  useEffect(() => {
    if (!policy) {
      return;
    }

    document.title = `${policy.title} | Cozy Candle`;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [policy]);

  if (!policy) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="policy-page">
      <section className="policy-hero" aria-labelledby="policy-title">
        <p className="policy-kicker">Cozy Candle</p>
        <h1 id="policy-title">{policy.title}</h1>
        {policy.intro && <p className="policy-intro">{policy.intro}</p>}
      </section>

      <article className="policy-content" itemScope itemType="https://schema.org/WebPage">
        {policy.sections.map((section) => (
          <section className="policy-section" key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body && <p>{section.body}</p>}
            {section.items && (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.lines && (
              <div className="policy-contact-lines">
                {section.lines.map((line) => (
                  <p key={line.label}>
                    <strong>{line.label}:</strong>{" "}
                    <a href={line.href} target={line.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                      {line.value}
                    </a>
                  </p>
                ))}
              </div>
            )}
          </section>
        ))}
      </article>

      <div className="policy-actions">
        <Link to="/shop">Continue Shopping</Link>
        <Link to="/#contact">Contact Us</Link>
      </div>
    </main>
  );
}
