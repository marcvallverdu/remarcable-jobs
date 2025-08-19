import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Parse connection URL to add pooling parameters
  const databaseUrl = process.env.DATABASE_URL || '';
  
  // Add connection pool limits for serverless
  const url = new URL(databaseUrl);
  url.searchParams.set('connection_limit', '1'); // Minimal connections
  url.searchParams.set('pool_timeout', '2'); // Quick timeout
  
  return new PrismaClient({
    datasources: {
      db: {
        url: url.toString(),
      },
    },
    // Minimal logging to reduce memory
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Error formatting uses less memory
    errorFormat: 'minimal',
  });
}

// Lazy initialization - only create when needed
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
}

export const prisma = globalForPrisma.prisma;

// Cleanup function for serverless environments
export async function disconnectPrisma() {
  await prisma.$disconnect();
}