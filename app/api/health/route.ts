import { NextResponse } from 'next/server';

export async function GET() {
  // Force garbage collection if available (helps in production)
  if (global.gc) {
    global.gc();
  }
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      memory: 'ok',
      rss: 'unknown',
      memoryStatus: 'unknown',
    },
  };

  try {
    // Lazy load prisma only when needed
    const { prisma } = await import('@/lib/db/prisma');
    
    // Check database connection
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;
    
    health.checks.database = `healthy (${dbResponseTime}ms)`;
    
    // Check memory usage with more detail
    const memUsage = process.memoryUsage();
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    
    // Add detailed memory info
    health.checks.memory = `${heapUsedMB}MB / ${heapTotalMB}MB (${Math.round(memoryUsagePercent)}%)`;
    health.checks.rss = `${rssMB}MB`;
    
    // Adjust thresholds for Vercel environment
    if (memoryUsagePercent > 85) {
      health.status = 'degraded';
      health.checks.memoryStatus = 'warning - consider redeploying';
    } else if (memoryUsagePercent > 70) {
      health.checks.memoryStatus = 'moderate';
    } else {
      health.checks.memoryStatus = 'healthy';
    }
    
    return NextResponse.json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = `error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    return NextResponse.json(health, { status: 503 });
  }
}