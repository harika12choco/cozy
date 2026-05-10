import { useEffect, useState } from "react";
import navLogo from "../assets/navlogo.png";
import "../styles/CinematicIntro.css";

const INTRO_STORAGE_KEY = "cozy-candles-cinematic-intro";

export default function CinematicIntro() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return sessionStorage.getItem(INTRO_STORAGE_KEY) !== "played";
  });
  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = prefersReducedMotion ? 1200 : 5200;

    document.body.classList.add("intro-lock");
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "played");
      setVisible(false);
      document.body.classList.remove("intro-lock");
    }, duration);

    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove("intro-lock");
    };
  }, [visible]);

  function finishIntro() {
    sessionStorage.setItem(INTRO_STORAGE_KEY, "played");
    setVisible(false);
    document.body.classList.remove("intro-lock");
  }

  if (!visible) {
    return null;
  }

  return (
    <section className="cinematic-intro" aria-label="Cozy Candles cinematic intro">
      <div className="intro-grain" aria-hidden="true" />
      <div className="intro-vignette" aria-hidden="true" />
      <div className="intro-backlight" aria-hidden="true" />

      <div className="intro-ember" aria-hidden="true" />

      <div className="intro-brand">
        <div className="intro-brand-glow" aria-hidden="true" />
        <img src={navLogo} alt="Cozy Candles" className="intro-logo" />
        <h1>Cozy Candles</h1>
        <p className="intro-kicker">Hand-poured luxury candles</p>
        <div className="intro-line" aria-hidden="true" />
      </div>

      <button className="intro-skip" type="button" onClick={finishIntro}>
        Skip
      </button>
    </section>
  );
}
