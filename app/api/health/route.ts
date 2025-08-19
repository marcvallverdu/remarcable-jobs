import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      memory: 'ok',
    },
  };

  try {
    // Check database connection
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;
    
    health.checks.database = `healthy (${dbResponseTime}ms)`;
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (memoryUsagePercent > 90) {
      health.checks.memory = 'warning';
      health.status = 'degraded';
    }
    
    return NextResponse.json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = `error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    return NextResponse.json(health, { status: 503 });
  }
}