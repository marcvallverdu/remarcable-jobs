import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { mapApiToOrganization, mapApiToJob, extractUniqueOrganizationKey } from '../lib/fantastic-jobs/mapper';
import { FantasticJobsResponse } from '../lib/fantastic-jobs/types';

const prisma = new PrismaClient();

async function main() {
  // Create a default admin user using Better Auth
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      isAdmin: true,
      emailVerified: true,
    },
  });
  
  // Create account for password login
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: 'credential',
        accountId: adminUser.email,
      },
    },
    update: {},
    create: {
      providerId: 'credential',
      accountId: adminUser.email,
      userId: adminUser.id,
      password: hashedPassword,
    },
  });
  
  console.log('Created admin user:', adminUser);
  
  // Load sample data from JSON file
  const sampleDataPath = path.join(__dirname, '../../../sample-response.json');
  const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf-8')) as FantasticJobsResponse[];
  
  console.log(`Loading ${sampleData.length} jobs from sample data...`);
  
  const organizationMap = new Map<string, string>();
  
  // Process each job from the sample data
  for (const apiJob of sampleData.slice(0, 20)) { // Load first 20 jobs for demo
    try {
      // Get or create organization
      const orgKey = extractUniqueOrganizationKey(apiJob);
      let organizationId = organizationMap.get(orgKey);
      
      if (!organizationId) {
        // Check if organization exists
        let organization = null;
        
        if (apiJob.linkedin_org_slug) {
          organization = await prisma.organization.findUnique({
            where: { linkedinSlug: apiJob.linkedin_org_slug },
          });
        }
        
        if (!organization && apiJob.domain_derived) {
          organization = await prisma.organization.findUnique({
            where: { domain: apiJob.domain_derived },
          });
        }
        
        if (!organization) {
          // Create new organization
          const orgData = mapApiToOrganization(apiJob);
          organization = await prisma.organization.create({
            data: orgData,
          });
          console.log(`Created organization: ${organization.name}`);
        }
        
        organizationId = organization.id;
        organizationMap.set(orgKey, organizationId);
      }
      
      // Check if job already exists
      const existingJob = await prisma.job.findUnique({
        where: { externalId: apiJob.id },
      });
      
      if (!existingJob) {
        // Create new job
        const jobData = mapApiToJob(apiJob, organizationId);
        const job = await prisma.job.create({
          data: jobData,
        });
        console.log(`Created job: ${job.title} at ${apiJob.organization}`);
      }
    } catch (error) {
      console.error(`Error processing job ${apiJob.id}:`, error);
    }
  }
  
  console.log('Sample data import completed!');
  
  // Create a sample saved query
  const savedQuery = await prisma.savedQuery.create({
    data: {
      name: 'Remote Engineering Jobs',
      description: 'Find remote software engineering positions',
      parameters: {
        q: 'software engineer',
        remote: true,
        employment_type: ['FULL_TIME'],
      },
      isActive: true,
      createdBy: adminUser.id,
    },
  });
  
  console.log('Created saved query:', savedQuery);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });