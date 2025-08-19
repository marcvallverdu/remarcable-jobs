// Debug the full response to understand what's happening
const axios = require('axios');

async function debugResponse() {
  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    const host = 'active-jobs-db.p.rapidapi.com';
    
    console.log('Making debug request to understand response structure...\n');
    console.log('API Key:', apiKey);
    console.log('Host:', host);
    console.log('\n---\n');
    
    const response = await axios.get(`https://${host}/active-ats-7d`, {
      params: {
        limit: '10',
        offset: '0',
        title_filter: 'COO'
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': host,
        'Accept': 'application/json'
      },
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\nResponse Data Structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if there's any error message in the response
    if (response.data.message) {
      console.log('\n⚠️  API Message:', response.data.message);
    }
    
    if (response.data.error) {
      console.log('\n❌ API Error:', response.data.error);
    }
    
    // Check rate limit headers
    console.log('\n--- Rate Limit Info ---');
    console.log('Requests Limit:', response.headers['x-ratelimit-requests-limit']);
    console.log('Requests Remaining:', response.headers['x-ratelimit-requests-remaining']);
    console.log('Requests Reset:', response.headers['x-ratelimit-requests-reset']);
    
    // Try to understand the data field
    if (response.data.data !== undefined) {
      console.log('\n--- Data Field Analysis ---');
      console.log('Type of data:', typeof response.data.data);
      console.log('Is Array?:', Array.isArray(response.data.data));
      console.log('Length/Keys:', Array.isArray(response.data.data) ? 
        response.data.data.length : 
        Object.keys(response.data.data || {})
      );
    }
    
  } catch (error) {
    console.error('\n❌ Complete Error:', error);
    if (error.response) {
      console.error('Error Response:', error.response.data);
      console.error('Error Status:', error.response.status);
    }
  }
}

// Load env and run test
require('dotenv').config({ path: '.env' });

if (!process.env.RAPIDAPI_KEY) {
  console.error('❌ RAPIDAPI_KEY not found in .env file');
  process.exit(1);
}

debugResponse();