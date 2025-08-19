import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/db/prisma';

// Ensure secret is available
const getAuthSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  
  // In production, we must have a real secret
  if (process.env.NODE_ENV === 'production' && !secret) {
    console.error('BETTER_AUTH_SECRET is not set in production!');
    // Use a placeholder that will fail gracefully
    return 'MISSING_SECRET_CHECK_ENV_VARS';
  }
  
  // In development, use a default secret
  if (!secret) {
    return 'dev-secret-change-in-production';
  }
  
  return secret;
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  secret: getAuthSecret(),
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
    ? [
        'https://remarcablejobs.com',
        'https://www.remarcablejobs.com',
        'https://remarcable-jobs.vercel.app',
        process.env.NEXT_PUBLIC_APP_URL || '',
      ].filter(Boolean)
    : ['http://localhost:3000'],
});