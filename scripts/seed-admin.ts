#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
  // You can change these values
  const ADMIN_EMAIL = 'marc@remarcablevc.com';
  const ADMIN_PASSWORD = '2219Megatorpe!'; // CHANGE THIS IN PRODUCTION!
  
  console.log('🔐 Creating admin user...\n');
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });
    
    if (existingUser) {
      console.log(`ℹ️  User ${ADMIN_EMAIL} already exists`);
      
      if (!existingUser.isAdmin) {
        await prisma.user.update({
          where: { email: ADMIN_EMAIL },
          data: { isAdmin: true },
        });
        console.log(`✅ User ${ADMIN_EMAIL} updated to admin`);
      } else {
        console.log(`✅ User ${ADMIN_EMAIL} is already an admin`);
      }
      
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
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
    
    console.log(`✅ Admin user created successfully!`);
    console.log(`\n📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`\n⚠️  IMPORTANT: Change the password after first login!`);
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();