"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/listings", label: "Listings" },
  { href: "/weekends", label: "Weekends" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { currentUser, ready, openPicker, signOut } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          Goon Trip
        </Link>
        <nav className={styles.nav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${
                pathname === item.href ? styles.active : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.spacer} />

        {/* avoid hydration flicker: render identity only once ready */}
        {ready &&
          (currentUser ? (
            <div className={styles.identity}>
              <span className={styles.who}>
                Hi, <span className={styles.name}>{currentUser.name}</span>
                {currentUser.isAdmin ? " (admin)" : ""}
              </span>
              <Button small variant="ghost" onClick={signOut}>
                Switch
              </Button>
            </div>
          ) : (
            <Button small variant="primary" onClick={openPicker}>
              Sign in
            </Button>
          ))}
      </div>
    </header>
  );
}
