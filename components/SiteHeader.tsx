"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/listings", label: "Listings" },
  { href: "/weekends", label: "Weekends" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { currentUser, ready, openPicker } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Left zone — brand links home */}
        <Link href="/" className={styles.brand}>
          Goon Trip
        </Link>

        {/* Center zone — page nav, evenly spread across the flexible middle */}
        <nav className={styles.nav} aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`${styles.link} ${
                pathname === item.href ? styles.active : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right zone — identity, opens the profile switcher */}
        <div className={styles.identity}>
          {/* avoid hydration flicker: render identity only once ready */}
          {ready &&
            (currentUser ? (
              <Avatar
                name={currentUser.name}
                onClick={openPicker}
                aria-label="Switch profile"
                title={`${currentUser.name}${
                  currentUser.isAdmin ? " (admin)" : ""
                } — switch profile`}
              />
            ) : (
              <Button small variant="primary" onClick={openPicker}>
                Sign in
              </Button>
            ))}
        </div>
      </div>
    </header>
  );
}
