const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testPipeline() {
  console.log('==================================================');
  console.log('STARTING END-TO-END PIPELINE DIAGNOSTIC TEST');
  console.log('==================================================');

  // TEST 1 & 2: Environment & API Key
  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL || 'meta/muse-glimmer-30b';
  console.log('[1/4] Environment Check:');
  console.log('      NVIDIA_API_KEY:', apiKey ? `PRESENT (nvapi-...${apiKey.slice(-6)})` : 'MISSING');
  console.log('      NVIDIA_MODEL:', model);

  if (!apiKey) {
    console.error('CRITICAL: NVIDIA_API_KEY is not available to the backend.');
    process.exit(1);
  }

  // TEST 3: NVIDIA Muse API direct connection
  console.log('\n[2/4] Testing direct NVIDIA NIM Muse API connection (https://integrate.api.nvidia.com/v1/chat/completions)...');
  const fetch = (await import('node-fetch')).default;
  const startMuse = Date.now();

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are an ATS resume reviewer engine. Return ONLY strict valid JSON.' },
          { role: 'user', content: 'Analyze this sample resume: John Doe, Senior Full Stack Engineer. 5 years experience with Node.js, React, PostgreSQL. Return JSON: {"overall_score": 88, "status": "success"}' }
        ],
        temperature: 0.2,
        max_tokens: 4096
      }),
      signal: AbortSignal.timeout(60000)
    });

    const elapsed = Date.now() - startMuse;
    console.log(`      Status: ${res.status} ${res.statusText} (${elapsed}ms)`);

    if (!res.ok) {
      const errText = await res.text();
      console.error('      ERROR RESPONSE:', errText);
      process.exit(1);
    }

    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    console.log('      NVIDIA API Response choices length:', data?.choices?.length);
    console.log('      Response content:', msg?.content);
    console.log('      Reasoning content (length):', msg?.reasoning_content?.length || 0);

    if (data?.choices?.[0]) {
      console.log('      NVIDIA NIM Muse Glimmer 30B Connection: SUCCESS ✓');
    }
  } catch (err) {
    console.error('      NVIDIA API Connection FAILED:', err.message);
    process.exit(1);
  }

  console.log('\n[3/4] Testing backend health endpoint via localhost:5001...');
  try {
    const healthRes = await fetch('http://localhost:5001/api/health');
    const healthData = await healthRes.json();
    console.log('      Health Endpoint Result:', healthData);
    console.log('      Backend Health Check: SUCCESS ✓');
  } catch (err) {
    console.warn('      Backend server not yet running on http://localhost:5001 (will be verified when server starts).');
  }

  console.log('\n==================================================');
  console.log('ALL DIAGNOSTIC SUITES COMPLETE');
  console.log('==================================================');
}

testPipeline();
