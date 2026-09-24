const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testNvidiaSpeed() {
  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL || 'meta/muse-glimmer-30b';
  const fetch = (await import('node-fetch')).default;

  const testCases = [
    {
      name: 'Super Crisp Bullet Rewrite Prompt',
      prompt: 'Rewrite these resume bullets to be active and quantified. Return JSON only with key "recommendations": [{"section":"experience","issue":"Passive phrasing","severity":"high","explanation":"Recruiters prefer active verbs","currentText":"Handled system updates","suggestedText":"Engineered automated system updates reducing downtime by [X%]"}]',
      max_tokens: 1024
    }
  ];

  for (const tc of testCases) {
    console.log(`\n--- Testing ${tc.name} ---`);
    const start = Date.now();
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
            { role: 'user', content: tc.prompt }
          ],
          temperature: 0.1,
          max_tokens: tc.max_tokens
        })
      });

      const elapsed = Date.now() - start;
      console.log(`Status: ${res.status} ${res.statusText} in ${elapsed}ms`);
      const data = await res.json();
      const msg = data?.choices?.[0]?.message;
      console.log('Reasoning length:', msg?.reasoning_content?.length);
      console.log('Content:', msg?.content?.slice(0, 300));
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

testNvidiaSpeed();
