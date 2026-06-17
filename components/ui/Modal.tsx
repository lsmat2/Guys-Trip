"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import styles from "./Modal.module.css";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  /** allow closing by clicking the backdrop / pressing Escape; default true */
  dismissable?: boolean;
  children: ReactNode;
};

/** Minimal accessible-ish modal. Closes on Escape and backdrop click. */
export default function Modal({
  open,
  title,
  onClose,
  dismissable = true,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onClick={dismissable ? onClose : undefined}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || dismissable) && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            {dismissable && (
              <button
                className={styles.close}
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
