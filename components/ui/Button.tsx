import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "default" | "primary" | "success" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** highlight as the currently-selected choice */
  active?: boolean;
  small?: boolean;
};

/** Bare, reusable button. Variants are class toggles over a shared base. */
export default function Button({
  variant = "default",
  active = false,
  small = false,
  className,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    variant !== "default" ? styles[variant] : "",
    active ? styles.active : "",
    small ? styles.small : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...rest} />;
}
