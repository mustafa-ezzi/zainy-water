"use client";

import { RedirectToSignIn, useAuth } from "@clerk/nextjs";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  // While Clerk is loading on the client, render nothing
  if (!isLoaded) {
    return <div style={{ display: "none" }} />;
  }

  // If user is not signed in, redirect to sign-in
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  // Only render children after we know user is signed in
  return <>{children}</>;
}
