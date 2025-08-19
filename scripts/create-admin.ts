#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function createAdmin() {
  console.log('🔐 Create Production Admin User\n');
  
  try {
    const email = await question('Admin email: ');
    const password = await question('Admin password: ');
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      const confirmUpdate = await question(`User ${email} already exists. Update to admin? (y/n): `);
      if (confirmUpdate.toLowerCase() === 'y') {
        await prisma.user.update({
          where: { email },
          data: { isAdmin: true },
        });
        console.log(`✅ User ${email} updated to admin`);
      }
      rl.close();
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Admin',
        isAdmin: true,
        emailVerified: true,
      },
    });
    
    // Create account for password login
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
      },
    });
    
    console.log(`\n✅ Admin user created successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   Login at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/login`);
    
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdmin();