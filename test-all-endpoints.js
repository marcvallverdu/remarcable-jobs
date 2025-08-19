// Test different endpoints and parameters to debug the issue
const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAllEndpoints() {
  const endpoints = [
    '/active-ats-7d',
    '/active-ats-24h', 
    '/active-ats-1h'
  ];
  
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = 'active-jobs-db.p.rapidapi.com';
  
  console.log('Testing all endpoints for COO jobs...\n');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 15)}...` : 'MISSING');
  console.log('Host:', host);
  console.log('---\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      
      const url = `https://${host}${endpoint}`;
      const params = {
        limit: '10',
        offset: '0',
        title_filter: 'COO'
      };
      
      console.log('  URL:', url);
      console.log('  Params:', JSON.stringify(params));
      
      const response = await axios.get(url, {
        params,
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': host
        },
        timeout: 10000
      });
      
      const jobs = response.data.data || [];
      console.log(`  ✅ Jobs found: ${jobs.length}`);
      
      if (jobs.length > 0) {
        console.log('  Sample titles:');
        jobs.slice(0, 3).forEach(job => {
          console.log(`    - ${job.title} at ${job.organization}`);
        });
      }
      
      // Also check the metadata
      if (response.data.total_count !== undefined) {
        console.log(`  Total count in DB: ${response.data.total_count}`);
      }
      if (response.data.page !== undefined) {
        console.log(`  Page info: ${response.data.page} of ${response.data.total_pages}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.response?.data?.message || error.message}`);
      if (error.response?.status === 429) {
        console.log('  Rate limit hit, waiting 3 seconds...');
        await sleep(3000);
      }
    }
    
    console.log('');
    await sleep(2000); // Wait between requests
  }
  
  // Now test without any filter to see if API is working at all
  console.log('\n--- Testing without filters (should return jobs) ---\n');
  
  try {
    const response = await axios.get(`https://${host}/active-ats-7d`, {
      params: { limit: '5' },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': host
      }
    });
    
    const jobs = response.data.data || [];
    console.log(`Jobs found without filters: ${jobs.length}`);
    if (jobs.length > 0) {
      console.log('\nFirst job to verify structure:');
      const firstJob = jobs[0];
      console.log('- ID:', firstJob.id);
      console.log('- Title:', firstJob.title);
      console.log('- Organization:', firstJob.organization);
      console.log('- Date Posted:', firstJob.date_posted);
    }
  } catch (error) {
    console.log(`Error: ${error.response?.data?.message || error.message}`);
  }
  
  // Test with a more common title
  console.log('\n--- Testing with "engineer" (should definitely have results) ---\n');
  
  try {
    const response = await axios.get(`https://${host}/active-ats-7d`, {
      params: { 
        limit: '5',
        title_filter: 'engineer'
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': host
      }
    });
    
    const jobs = response.data.data || [];
    console.log(`Jobs found for "engineer": ${jobs.length}`);
    if (jobs.length > 0) {
      jobs.slice(0, 3).forEach(job => {
        console.log(`- ${job.title}`);
      });
    }
  } catch (error) {
    console.log(`Error: ${error.response?.data?.message || error.message}`);
  }
}

// Load env and run test
require('dotenv').config({ path: '.env' });

if (!process.env.RAPIDAPI_KEY) {
  console.error('❌ RAPIDAPI_KEY not found in .env file');
  process.exit(1);
}

testAllEndpoints();