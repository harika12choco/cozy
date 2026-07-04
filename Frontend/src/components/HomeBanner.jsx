import "../styles/HomeBanner.css";
import storyImage from "../assets/ourstory.jpeg";

export default function HomeBanner() {
  return (
    <section className="home-story" aria-labelledby="home-story-title">
      <div className="home-story-heading">
        <h2 id="home-story-title">Our Story</h2>
        <div className="home-story-divider" aria-hidden="true">
          <span />
          <i>♡</i>
          <span />
        </div>
        <p>The journey behind Cozy Candle</p>
      </div>

      <div className="home-story-content">
        <div className="home-story-visual">
          <span className="home-story-sprig" aria-hidden="true" />
          <img
            src={storyImage}
            alt="Handcrafted floral candles arranged with gifts and flowers"
          />
          <div className="home-story-seal" aria-hidden="true">
            <span>Handpoured</span>
            <strong>CC</strong>
            <span>With Love</span>
          </div>
        </div>

        <article className="home-story-note">
          <span className="home-story-tape" aria-hidden="true" />
          <h3>A note from Akanksha</h3>
          <p className="home-story-lead">
            Hi, I'm Akanksha — the person behind every candle you see here.
          </p>

          <div className="home-story-copy">
            <p>
              Almost a decade ago, I stepped away from work for reasons that felt
              bigger than me at the time. And then life did what life does — I got
              married, built a home, became a mother. I loved every bit of it. But
              somewhere in between school runs and chai breaks, there was this quiet
              little voice that kept saying, you still have something to make.
            </p>
            <p>
              I ignored it for years. And then, in 2025, I decided to stop ignoring
              it.
            </p>
            <p>
              Cozy Candle started on my kitchen counter — just me, some soy wax, and
              a whole lot of trial and error. It wasn't perfect. It still isn't. But
              it's mine, and that means everything.
            </p>
            <p>
              I make every candle by hand, mostly in the hours when the house is
              quiet. Each one is made with a lot of care — not just because I want
              it to smell beautiful in your home, but because in a small way, each
              one is proof to myself that starting over is always worth it.
            </p>
            <p>
              If you've ever felt like you missed your window — like life happened
              and your dreams quietly packed up and left — I want you to know they
              didn't. Mine just waited thirteen years. 😊
            </p>
            <p>
              Thank you for being here. Every order, every message, every little
              bit of support — it reaches me personally, and it means more than I
              know how to say.
            </p>
          </div>

          <div className="home-story-signature">
            <span>With love,</span>
            <strong>Akanksha Rishabh</strong>
            <em>
              "Dreams don't expire. Sometimes they just wait for the right moment
              to shine."
            </em>
          </div>
        </article>
      </div>
    </section>
  );
}
