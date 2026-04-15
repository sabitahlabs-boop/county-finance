/**
 * County Finance — Clerk Auth Provider
 * Wraps the app with Clerk authentication context
 * Replaces Manus OAuth flow on the frontend
 */

import { ClerkProvider, SignIn, SignUp, useUser, useAuth } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
}

// ── Provider Wrapper ──

interface CountyClerkProviderProps {
  children: React.ReactNode;
}

export function CountyClerkProvider({ children }: CountyClerkProviderProps) {
  return (
    <ClerkProvider
      publishableKey={CLERK_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#22C55E",      // County green
          colorBackground: "#1A2744",   // County navy
          colorText: "#F8FAFC",
          colorInputBackground: "#0F1729",
          colorInputText: "#F8FAFC",
          borderRadius: "0.75rem",
          fontFamily: "Inter, sans-serif",
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: "#22C55E",
            "&:hover": { backgroundColor: "#16A34A" },
          },
          card: {
            backgroundColor: "#1A2744",
            borderColor: "#334155",
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

// ── Pre-built Sign In Page ──

export function CountySignIn() {
  return (
    <div className="min-h-screen bg-[#0F1729] flex items-center justify-center">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
      />
    </div>
  );
}

// ── Pre-built Sign Up Page ──

export function CountySignUp() {
  return (
    <div className="min-h-screen bg-[#0F1729] flex items-center justify-center">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/onboarding"
      />
    </div>
  );
}

// ── Re-export hooks for convenience ──

export { useUser, useAuth };
