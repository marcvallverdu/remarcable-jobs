// Test script to make the EXACT same call as the playground
const axios = require('axios');

async function testExactCall() {
  try {
    // Exactly matching the playground URL:
    // https://active-jobs-db.p.rapidapi.com/active-ats-7d?limit=10&offset=0&title_filter=COO&location_filter=%22
    
    const params = {
      limit: '10',
      offset: '0', 
      title_filter: 'COO'
      // Note: NOT including location_filter since it appears empty in playground
    };
    
    const url = 'https://active-jobs-db.p.rapidapi.com/active-ats-7d';
    
    console.log('Making EXACT call as playground:\n');
    console.log('URL:', url);
    console.log('Params:', JSON.stringify(params, null, 2));
    
    // Build the full URL with params to show exactly what we're calling
    const fullUrl = url + '?' + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    console.log('\nFull URL:', fullUrl);
    console.log('\nPlayground URL for comparison:');
    console.log('https://active-jobs-db.p.rapidapi.com/active-ats-7d?limit=10&offset=0&title_filter=COO\n');
    
    const response = await axios.get(url, {
      params: params,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com'
      }
    });
    
    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Jobs found:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\nFirst 3 job titles:');
      response.data.data.slice(0, 3).forEach((job, i) => {
        console.log(`${i + 1}. ${job.title} at ${job.organization}`);
      });
    }
    
    // Now test with adding empty location_filter like playground might have
    console.log('\n\n--- Testing with empty location_filter (like playground) ---\n');
    
    const params2 = {
      limit: '10',
      offset: '0',
      title_filter: 'COO',
      location_filter: '' // Empty string
    };
    
    console.log('Params with empty location:', JSON.stringify(params2, null, 2));
    
    const response2 = await axios.get(url, {
      params: params2,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com'
      }
    });
    
    console.log('\n✅ Response with empty location_filter:');
    console.log('Jobs found:', response2.data.data?.length || 0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

// Load env and run test
require('dotenv').config({ path: '.env' });

if (!process.env.RAPIDAPI_KEY) {
  console.error('❌ RAPIDAPI_KEY not found in .env file');
  process.exit(1);
}

console.log('Using API Key:', process.env.RAPIDAPI_KEY ? '✓ Found' : '✗ Missing');
console.log('API Key starts with:', process.env.RAPIDAPI_KEY?.substring(0, 10) + '...\n');

testExactCall();