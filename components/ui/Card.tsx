import type { HTMLAttributes } from "react";
import styles from "./Card.module.css";

/** Simple bordered surface. */
export default function Card({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={[styles.card, className ?? ""].join(" ").trim()} {...rest} />;
}
