import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Get database URL
  const databaseUrl = process.env.DATABASE_URL;
  
  // If no database URL, return a dummy client for build time
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set, using dummy Prisma client for build');
    // Return a minimal Prisma client that won't crash during build
    return new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://dummy:dummy@localhost:5432/dummy?schema=public',
        },
      },
      // Minimal logging to reduce memory
      log: ['error'],
      // Error formatting uses less memory
      errorFormat: 'minimal',
    });
  }
  
  // Parse connection URL to add pooling parameters
  let finalUrl: string;
  try {
    const url = new URL(databaseUrl);
    // Add connection pool limits for serverless
    url.searchParams.set('connection_limit', '1'); // Minimal connections
    url.searchParams.set('pool_timeout', '2'); // Quick timeout
    finalUrl = url.toString();
  } catch (error) {
    console.error('Invalid DATABASE_URL format:', error);
    // Use the URL as-is if we can't parse it
    finalUrl = databaseUrl;
  }
  
  return new PrismaClient({
    datasources: {
      db: {
        url: finalUrl,
      },
    },
    // Minimal logging to reduce memory
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Error formatting uses less memory
    errorFormat: 'minimal',
  });
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Export prisma client that only initializes when accessed
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    return client[prop as keyof PrismaClient];
  },
});

// Cleanup function for serverless environments
export async function disconnectPrisma() {
  await prisma.$disconnect();
}