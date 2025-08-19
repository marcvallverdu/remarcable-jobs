import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}) as ReturnType<typeof createAuthClient>;

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;