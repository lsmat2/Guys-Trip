import type { TextareaHTMLAttributes } from "react";
import styles from "./Textarea.module.css";

/** Shared multi-line text input. Mirrors <Input> so fields stay consistent. */
export default function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[styles.textarea, className ?? ""].join(" ").trim()}
      {...rest}
    />
  );
}
