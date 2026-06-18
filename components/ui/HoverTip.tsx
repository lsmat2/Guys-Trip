"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./HoverTip.module.css";

/** ms a tapped tip stays visible before auto-hiding (touch has no hover). */
const REVEAL_MS = 600;

type Props = {
  /** tooltip contents */
  label: ReactNode;
  /** the trigger (an avatar, a chip, …) */
  children: ReactNode;
  /** applied to the wrapper, e.g. for stack overlap margins */
  className?: string;
  /**
   * Horizontal anchoring. "center" (default) centers the tip over the trigger;
   * "end" anchors its right edge to the trigger so it extends leftward — use
   * for triggers near the right screen edge so the tip isn't clipped.
   */
  align?: "center" | "end";
};

/**
 * Wraps a trigger and reveals a tooltip above it on hover (hover-capable
 * devices) or tap (auto-hides after a moment, so it never sticks). Shared by
 * the avatar badges and the AvatarStack "+N" chip so they behave identically.
 */
export default function HoverTip({
  label,
  children,
  className,
  align = "center",
}: Props) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // tap reveals, then auto-hides — so it never "persists" like a toggle
  function reveal() {
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), REVEAL_MS);
  }

  return (
    <span className={`${styles.wrap} ${className ?? ""}`.trim()} onClick={reveal}>
      {children}
      <span
        className={`${styles.tip} ${align === "end" ? styles.alignEnd : ""} ${
          open ? styles.open : ""
        }`.trim()}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
