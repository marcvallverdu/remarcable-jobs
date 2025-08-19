// Test script to verify API is working
const axios = require('axios');

// Helper to add delay between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAPI() {
  try {
    console.log('Testing RapidAPI with different queries (with delays to avoid rate limits)...\n');
    
    // Test 1: No filters (should return jobs)
    console.log('1. Testing with no filters (should return jobs)...');
    const response1 = await axios.get(
      'https://active-jobs-db.p.rapidapi.com/active-ats-7d',
      {
        params: {
          limit: '5'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com'
        }
      }
    );
    console.log('   Jobs found:', response1.data.data?.length || 0);
    
    await sleep(2000); // Wait 2 seconds
    
    // Test 2: With title_filter
    console.log('\n2. Testing with title_filter="engineer"...');
    const response2 = await axios.get(
      'https://active-jobs-db.p.rapidapi.com/active-ats-7d',
      {
        params: {
          title_filter: 'engineer',
          limit: '5'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com'
        }
      }
    );
    console.log('   Jobs found:', response2.data.data?.length || 0);
    
    await sleep(2000); // Wait 2 seconds
    
    // Test 3: With organization_filter
    console.log('\n3. Testing with organization_filter="google"...');
    const response3 = await axios.get(
      'https://active-jobs-db.p.rapidapi.com/active-ats-7d',
      {
        params: {
          organization_filter: 'google',
          limit: '5'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com'
        }
      }
    );
    console.log('   Jobs found:', response3.data.data?.length || 0);
    
    // Test 4: With location_filter
    console.log('\n4. Testing with location_filter="San Francisco"...');
    const response4 = await axios.get(
      'https://active-jobs-db.p.rapidapi.com/active-ats-7d',
      {
        params: {
          location_filter: 'San Francisco',
          limit: '5'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com'
        }
      }
    );
    console.log('   Jobs found:', response4.data.data?.length || 0);
    
    // Test 5: Try "COO" with different variations
    console.log('\n5. Testing COO variations...');
    
    // Try exact match
    console.log('   a. title_filter="COO"...');
    const response5a = await axios.get(
      'https://active-jobs-db.p.rapidapi.com/active-ats-7d',
      {
        params: {
          title_filter: 'COO',
          limit: '5'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com'
        }
      }
    );
    console.log('      Jobs found:', response5a.data.data?.length || 0);
    
    // Try with Chief Operating Officer
    console.log('   b. title_filter="Chief Operating Officer"...');
    const response5b = await axios.get(
      'https://active-jobs-db.p.rapidapi.com/active-ats-7d',
      {
        params: {
          title_filter: 'Chief Operating Officer',
          limit: '5'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com'
        }
      }
    );
    console.log('      Jobs found:', response5b.data.data?.length || 0);
    if (response5b.data.data?.length > 0) {
      console.log('\n      Sample job titles:');
      response5b.data.data.slice(0, 3).forEach(job => {
        console.log(`      - ${job.title}`);
      });
    }
    
    // Try with "chief"
    console.log('   c. title_filter="chief"...');
    const response5c = await axios.get(
      'https://active-jobs-db.p.rapidapi.com/active-ats-7d',
      {
        params: {
          title_filter: 'chief',
          limit: '5'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com'
        }
      }
    );
    console.log('      Jobs found:', response5c.data.data?.length || 0);
    if (response5c.data.data?.length > 0) {
      console.log('\n      Sample job titles:');
      response5c.data.data.slice(0, 3).forEach(job => {
        console.log(`      - ${job.title}`);
      });
    }
    
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

testAPI();