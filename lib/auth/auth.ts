import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/db/prisma';

// Lazy initialization to ensure env vars are available at runtime
let authInstance: ReturnType<typeof betterAuth> | null = null;

function createAuth() {
  // Get secret at runtime, not build time
  const secret = process.env.BETTER_AUTH_SECRET;
  
  // In production, we must have a real secret
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('BETTER_AUTH_SECRET environment variable is not set in production!');
  }
  
  // In development, use a generated secret
  const authSecret = secret || Buffer.from('development-only-secret-do-not-use-in-production').toString('hex');
  
  // Validate the secret is hex format
  if (secret && !/^[0-9a-fA-F]+$/.test(secret)) {
    console.error('BETTER_AUTH_SECRET must be a hex string! Got:', secret.substring(0, 10) + '...');
  }
  
  console.log('Initializing Better Auth with secret length:', authSecret?.length);
  
  return betterAuth({
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
      ? [
          'https://remarcablejobs.com',
          'https://www.remarcablejobs.com',
          'https://remarcable-jobs.vercel.app',
          process.env.NEXT_PUBLIC_APP_URL || '',
        ].filter(Boolean)
      : ['http://localhost:3000'],
  });
}

// Export a getter that lazily initializes auth ONLY when accessed
function getAuth() {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}

// Use a Proxy to make it behave like the original auth object
// but only initialize when actually accessed
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(target, prop) {
    const instance = getAuth();
    return instance[prop as keyof typeof instance];
  },
  has(target, prop) {
    const instance = getAuth();
    return prop in instance;
  },
});