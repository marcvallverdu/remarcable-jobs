import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/db/prisma';

// Lazy initialization to ensure env vars are available at runtime
let authInstance: ReturnType<typeof betterAuth> | null = null;

function createAuth() {
  // Get deployment type to configure auth appropriately
  const deploymentType = process.env.NEXT_PUBLIC_DEPLOYMENT_TYPE; // 'admin' or 'board'
  const boardSlug = process.env.NEXT_PUBLIC_BOARD_SLUG;
  
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
  
  console.log('Initializing Better Auth for deployment type:', deploymentType || 'development');
  
  // Determine base URL with proper fallbacks
  let baseURL = 'http://localhost:3000'; // Safe default
  if (process.env.BETTER_AUTH_URL) {
    baseURL = process.env.BETTER_AUTH_URL;
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    baseURL = process.env.NEXT_PUBLIC_APP_URL;
  } else if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  } else if (process.env.VERCEL_URL) {
    // Vercel provides this automatically
    baseURL = `https://${process.env.VERCEL_URL}`;
  }
  
  // Determine cookie name based on deployment type
  let cookieName = 'auth-session'; // Default for development
  let sessionExpiresIn = 60 * 60 * 24 * 7; // Default: 7 days
  
  if (deploymentType === 'admin') {
    cookieName = 'admin-auth-session';
    sessionExpiresIn = 60 * 60 * 4; // Admin sessions: 4 hours for security
  } else if (deploymentType === 'board' && boardSlug) {
    cookieName = `board-${boardSlug}-session`;
    sessionExpiresIn = 60 * 60 * 24 * 30; // Board sessions: 30 days
  }
  
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    baseURL,
    secret: authSecret,
    session: {
      cookieName,
      expiresIn: sessionExpiresIn,
      updateAge: sessionExpiresIn / 4, // Update session when 1/4 of time remaining
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    user: {
      additionalFields: {
        isAdmin: {
          type: 'boolean',
          defaultValue: false,
          required: false,
        },
        boardAccess: {
          type: 'string[]', // Array of board slugs the user can access
          defaultValue: [],
          required: false,
        },
        userType: {
          type: 'string', // 'admin', 'employer', 'candidate'
          defaultValue: 'employer',
          required: false,
        },
      },
    },
    trustedOrigins: process.env.NODE_ENV === 'production' 
      ? [
          'https://remarcablejobs.com',
          'https://www.remarcablejobs.com',
          'https://remarcable-jobs.vercel.app',
          baseURL, // Include the current deployment's URL
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