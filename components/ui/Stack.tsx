import type { CSSProperties, ReactNode } from "react";

type StackProps = {
  children: ReactNode;
  /** flex direction; defaults to column */
  direction?: "row" | "column";
  /** gap in px; defaults to 12 */
  gap?: number;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  wrap?: boolean;
  style?: CSSProperties;
};

/** Minimal flex layout primitive — the building block for spacing rows/columns. */
export default function Stack({
  children,
  direction = "column",
  gap = 12,
  align,
  justify,
  wrap = false,
  style,
}: StackProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        gap,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? "wrap" : "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
