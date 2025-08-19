import { NextResponse } from 'next/server';

// Lightweight health check that doesn't load Prisma
export async function GET() {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const memUsage = process.memoryUsage();
  const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  return NextResponse.json({
    status: memoryUsagePercent > 85 ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      percent: `${Math.round(memoryUsagePercent)}%`,
    },
    environment: process.env.NODE_ENV,
  });
}