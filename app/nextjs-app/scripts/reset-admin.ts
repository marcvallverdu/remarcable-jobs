import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete existing admin account
  await prisma.account.deleteMany({
    where: { accountId: 'admin@example.com' }
  });
  
  // Delete existing admin user
  await prisma.user.deleteMany({
    where: { email: 'admin@example.com' }
  });
  
  console.log('Cleaned up old admin user');
  
  // Create new admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      isAdmin: true,
      emailVerified: true,
    },
  });
  
  console.log('Created new admin user:', adminUser.id);
  
  // For Better Auth, we don't store the password directly in Account table
  // Better Auth handles password storage internally
  // We need to use Better Auth's API to create the user properly
  
  console.log('\nNOTE: Please use Better Auth API to set the password.');
  console.log('Or create a new admin user through the signup flow.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });