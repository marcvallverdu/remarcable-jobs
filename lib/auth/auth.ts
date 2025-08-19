import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/db/prisma';

// Generate a fallback secret for development/build time
// In production, BETTER_AUTH_SECRET must be set
const authSecret = process.env.BETTER_AUTH_SECRET || 
  (process.env.NODE_ENV === 'production' 
    ? undefined 
    : 'dev-secret-change-in-production');

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  secret: authSecret,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      isAdmin: {
        type: 'boolean',
        defaultValue: false,
      },
    },
  },
  trustedOrigins: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_APP_URL || ''].filter(Boolean)
    : ['http://localhost:3000'],
});