// Test script to verify COO query works
const axios = require('axios');

async function testCOOQuery() {
  try {
    console.log('Testing RapidAPI directly with title_filter=COO...\n');
    
    const response = await axios.get(
      'https://active-jobs-db.p.rapidapi.com/active-ats-7d',
      {
        params: {
          title_filter: 'COO',
          limit: '10'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com'
        }
      }
    );
    
    console.log('✅ API Response received');
    console.log('Total jobs found:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\nFirst 3 jobs:');
      response.data.data.slice(0, 3).forEach((job, i) => {
        console.log(`\n${i + 1}. ${job.title}`);
        console.log(`   Company: ${job.organization}`);
        console.log(`   Location: ${job.locations_raw?.[0]?.address || 'N/A'}`);
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Load env and run test
require('dotenv').config({ path: '.env' });

if (!process.env.RAPIDAPI_KEY) {
  console.error('❌ RAPIDAPI_KEY not found in .env file');
  process.exit(1);
}

testCOOQuery();