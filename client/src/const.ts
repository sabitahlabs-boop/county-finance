export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Get the sign-in URL (now powered by Clerk, replacing Manus OAuth)
 * Returns Clerk's hosted sign-in page with redirect back to current origin
 */
export const getLoginUrl = () => {
  const redirectUrl = `${window.location.origin}/onboarding`;
  return `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;
};

export const getSignUpUrl = () => {
  const redirectUrl = `${window.location.origin}/onboarding`;
  return `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`;
};
