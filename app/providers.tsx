"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";
import ProfilePicker from "@/components/ProfilePicker";

/**
 * Client-side app shell: identity context + global chrome (header, profile
 * picker modal). Kept in one client component so the root layout stays a
 * Server Component.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SiteHeader />
      {children}
      <ProfilePicker />
    </AuthProvider>
  );
}
