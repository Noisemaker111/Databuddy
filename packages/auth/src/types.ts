import type { User, Session } from "@databuddy/auth";
// Combined session data type
export interface SessionData {
  role: string;
  user: User;
  session: Session;
}

// Auth error types
export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

// Provider types
export type Provider = 
  | "email" 
  | "google" 
  | "github" 
  | "credentials";

// Sign in options
export interface SignInOptions {
  redirect?: boolean;
  redirectUrl?: string;
  provider?: Provider;
}

// Sign up options
export interface SignUpOptions {
  redirect?: boolean;
  redirectUrl?: string;
}
