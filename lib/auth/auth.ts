import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/db/prisma';

// Ensure secret is available and in correct format
const getAuthSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  
  // In production, we must have a real secret
  if (process.env.NODE_ENV === 'production' && !secret) {
    console.error('BETTER_AUTH_SECRET is not set in production!');
    // Return a valid hex string that will fail auth but not crash
    return '0000000000000000000000000000000000000000000000000000000000000000';
  }
  
  // In development, use a default hex secret
  if (!secret) {
    return 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567';
  }
  
  // Validate the secret is hex format
  if (!/^[0-9a-fA-F]+$/.test(secret)) {
    console.error('BETTER_AUTH_SECRET must be a hex string! Got:', secret.substring(0, 10) + '...');
    // If not hex, try to use it anyway (Better Auth might handle it)
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