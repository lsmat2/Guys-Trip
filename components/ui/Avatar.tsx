import type { ButtonHTMLAttributes } from "react";
import styles from "./Avatar.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { name: string };

/** Circular avatar showing the first letter of a name. Behaves as a button. */
export default function Avatar({ name, className, ...rest }: Props) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <button
      type="button"
      className={[styles.avatar, className ?? ""].join(" ").trim()}
      {...rest}
    >
      {letter}
    </button>
  );
}
