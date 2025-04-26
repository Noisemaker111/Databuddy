import { createAuthClient } from "better-auth/react"
import { customSessionClient, twoFactorClient, organizationClient, emailOTPClient, magicLinkClient, multiSessionClient } from "better-auth/client/plugins";
import type { auth } from "../auth";
import type { AuthUser } from "../types";

// Define a type for the auth client configuration
export type AuthClientConfig = {
  baseURL?: string;
  debug?: boolean;
};

// Default configuration that can be overridden
const defaultConfig: AuthClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL as string,
  debug: process.env.NODE_ENV !== "production",
};

// Create a singleton instance with the default configuration
export const authClient = createAuthClient({
  baseURL: defaultConfig.baseURL,
  plugins: [
    customSessionClient<typeof auth>(),
    twoFactorClient(),
    multiSessionClient(),
    emailOTPClient(),
    magicLinkClient(),
  ],
});

const signIn = authClient.signIn;
const signUp = authClient.signUp;
const signOut = authClient.signOut;
const useSession = authClient.useSession;
const getSession = authClient.getSession;

export { signIn, signUp, signOut, useSession, getSession };

// Export a helper to check if the user has a specific role
export function hasRole(user: AuthUser | null | undefined, role: string | string[]) {
  if (!user) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}