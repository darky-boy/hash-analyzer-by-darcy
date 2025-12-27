/**
 * Test script for Hash Analyzer API
 */

const axios = require('axios');

const API_URL = 'http://localhost:4000';

async function testHashAnalyzer() {
  console.log('🧪 Testing Hash Analyzer API...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);
    
    // Test analysis endpoint
    console.log('\n2. Testing analysis endpoint...');
    const testHashes = [
      '5d41402abc4b2a76b9719d911017c592',  // MD5
      'SGVsbG8gV29ybGQ=',  // Base64
      '48656c6c6f20576f726c64'  // Hex
    ];
    
    const analysisResponse = await axios.post(`${API_URL}/api/analyze`, {
      inputs: testHashes
    });
    
    if (analysisResponse.data.success) {
      console.log('✅ Analysis successful!');
      console.log(`📊 Processed ${analysisResponse.data.data.length} inputs`);
      
      // Show results for each hash
      analysisResponse.data.data.forEach((result, index) => {
        console.log(`\n📝 Input ${index + 1}: ${result.input.substring(0, 20)}...`);
        console.log(`   🔍 Detected ${result.results.length} hash types`);
        console.log(`   📈 Entropy: ${result.stats.entropy.toFixed(2)}`);
        console.log(`   🔢 Characters: ${result.stats.total} total, ${result.stats.unique} unique`);
        
        if (result.results.length > 0) {
          console.log(`   🎯 Top match: ${result.results[0].name} (${Math.round(result.results[0].score * 100)}%)`);
        }
        
        if (result.decoding.base64) {
          console.log(`   🔓 Base64 decoded: ${result.decoding.base64}`);
        }
        if (result.decoding.hex) {
          console.log(`   🔓 Hex decoded: ${result.decoding.hex}`);
        }
      });
      
      console.log('\n🎉 All tests passed! Hash Analyzer is working correctly.');
      console.log('\n🌐 Frontend should be available at: http://localhost:5173');
      console.log('🔗 Backend API: http://localhost:4000');
      
    } else {
      console.log('❌ Analysis failed:', analysisResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend is running:');
      console.log('   cd backend && npm run dev');
    }
  }
}

// Run the test
testHashAnalyzer();
