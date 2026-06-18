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
 * Wraps a trigger and reveals a tooltip above it on hover (mouse) or tap
 * (auto-hides after a moment). The tip is only mounted while shown — closed
 * tips would otherwise sit off-screen at opacity:0 and expand the page's
 * scroll region (phantom horizontal/vertical scroll). Shared by the avatar
 * badges and the AvatarStack "+N" chip so they behave identically.
 */
export default function HoverTip({
  label,
  children,
  className,
  align = "center",
}: Props) {
  const [tapped, setTapped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // tap reveals, then auto-hides — so it never "persists" like a toggle
  function reveal() {
    setTapped(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setTapped(false), REVEAL_MS);
  }

  const visible = tapped || hovered;

  return (
    <span
      className={`${styles.wrap} ${className ?? ""}`.trim()}
      onClick={reveal}
      // hover only for a real pointer — touch never sets it, so it can't stick
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setHovered(false);
      }}
    >
      {children}
      {visible && (
        <span
          className={`${styles.tip} ${align === "end" ? styles.alignEnd : ""}`.trim()}
          role="tooltip"
        >
          {label}
        </span>
      )}
    </span>
  );
}
