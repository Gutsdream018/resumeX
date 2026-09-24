const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testNvidia() {
  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL || 'meta/muse-glimmer-30b';
  console.log('Testing NVIDIA API Key presence:', apiKey ? 'PRESENT (len: ' + apiKey.length + ')' : 'MISSING');
  console.log('Model:', model);

  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
        temperature: 0.5,
        max_tokens: 50
      })
    });

    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testNvidia();
