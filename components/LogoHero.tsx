"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LogoHero.module.css";

/** How long the hands stay revealed after a tap, in ms. */
const REVEAL_MS = 3000;

/**
 * Lander hero: the Goon Trip logo. Tapping it briefly flashes a hand on
 * either side for {@link REVEAL_MS}, then they vanish. Purely decorative —
 * no nav, no data. Intended as a base to build a richer animation onto later.
 */
export default function LogoHero() {
  const [revealed, setRevealed] = useState(false);
  // hold the dismiss timer so a re-tap resets the window instead of stacking timers
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashHands() {
    if (timer.current) clearTimeout(timer.current);
    setRevealed(true);
    timer.current = setTimeout(() => setRevealed(false), REVEAL_MS);
  }

  // clear any pending timer if the component unmounts mid-reveal
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div className={styles.hero}>
      <div className={styles.stage}>
        {/* hands are absolutely positioned, so they never shift the logo or
            expand the scroll region; mounted only while revealed */}
        {revealed && (
          <>
            <img
              src="/left-hand.png"
              alt=""
              aria-hidden
              className={`${styles.hand} ${styles.left}`}
            />
            <img
              src="/right-hand.png"
              alt=""
              aria-hidden
              className={`${styles.hand} ${styles.right}`}
            />
          </>
        )}

        <button
          type="button"
          className={styles.trigger}
          onClick={flashHands}
          aria-label="Goon Trip"
        >
          <img src="/goon-trip.png" alt="Goon Trip" className={styles.logo} />
        </button>
      </div>
    </div>
  );
}
