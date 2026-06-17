import type { ReactNode } from "react";

/** Centered, max-width page column. Wrap page content in this. */
export default function Container({ children }: { children: ReactNode }) {
  return <main className="container">{children}</main>;
}
