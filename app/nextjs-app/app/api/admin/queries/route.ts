import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const queries = await prisma.savedQuery.findMany({
      where: { createdBy: session.user.id },
      include: {
        _count: {
          select: { fetchLogs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(queries);
  } catch (error) {
    console.error('Error fetching queries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Store the complete query configuration including endpoint
    const queryData = {
      name: body.name,
      description: body.description || null,
      parameters: {
        endpoint: body.endpoint,
        ...body.parameters,
      },
      isActive: body.isActive ?? true,
      createdBy: session.user.id,
    };
    
    const query = await prisma.savedQuery.create({
      data: queryData,
    });
    
    return NextResponse.json(query);
  } catch (error) {
    console.error('Error creating query:', error);
    return NextResponse.json(
      { error: 'Failed to create query' },
      { status: 500 }
    );
  }
}