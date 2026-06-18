import type { InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

/** Shared text input. Single place to adjust field styling app-wide. */
export default function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={[styles.input, className ?? ""].join(" ").trim()} {...rest} />
  );
}
