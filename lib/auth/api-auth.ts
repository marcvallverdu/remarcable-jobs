import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function validateBearerToken(request: NextRequest): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return { valid: false, error: 'No authorization header' };
    }
    
    // Check if it's a bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Invalid authorization format' };
    }
    
    // Extract token
    const token = authHeader.substring(7);
    
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }
    
    // Look up token in database
    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: { user: true },
    });
    
    if (!apiToken) {
      return { valid: false, error: 'Invalid token' };
    }
    
    // Check if token is expired
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Update last used timestamp
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    });
    
    return { valid: true, userId: apiToken.userId };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}

// Helper to create a standardized unauthorized response
export function unauthorizedResponse(message = 'Unauthorized') {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer',
      },
    }
  );
}