"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LogoHero.module.css";

/** Reveal phases. Hands slide out (enter), bobble in place, then slide back
 *  into the logo (exit) before unmounting (idle). */
type Phase = "idle" | "enter" | "bobble" | "exit";

/** Slide-in / slide-out duration, kept in sync with the CSS animations. */
const SLIDE_MS = 160;
/** Total time the hands are on screen, enter + bobble + exit inclusive. */
const REVEAL_MS = 3000;

/**
 * Lander hero: the Goon Trip logo. On load (and on every tap) a hand flashes
 * out on either side, bobbles up/down in opposition, then slides back into the
 * logo. Purely decorative — no nav, no data.
 */
export default function LogoHero() {
  const [phase, setPhase] = useState<Phase>("idle");
  // hold the in-flight timers so a re-tap resets the sequence instead of stacking
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function flashHands() {
    clearTimers();
    setPhase("enter");
    timers.current.push(
      setTimeout(() => setPhase("bobble"), SLIDE_MS),
      setTimeout(() => setPhase("exit"), REVEAL_MS - SLIDE_MS),
      setTimeout(() => setPhase("idle"), REVEAL_MS),
    );
  }

  // flash once on load; clean up any pending timers if we unmount mid-reveal
  useEffect(() => {
    flashHands();
    return clearTimers;
    // run once on mount — flashHands is stable for our purposes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.hero}>
      <div className={styles.stage}>
        {/* slots are absolutely positioned, so the hands never shift the logo
            or expand the scroll region; mounted only while revealed.
            outer .mover slides horizontally, inner <img> bobbles vertically —
            separate elements so the two transforms don't fight. */}
        {phase !== "idle" && (
          <>
            <div className={`${styles.slot} ${styles.left} ${styles[phase]}`} aria-hidden>
              <div className={styles.mover}>
                <img src="/left-hand.png" alt="" className={styles.hand} />
              </div>
            </div>
            <div className={`${styles.slot} ${styles.right} ${styles[phase]}`} aria-hidden>
              <div className={styles.mover}>
                <img src="/right-hand.png" alt="" className={styles.hand} />
              </div>
            </div>
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
