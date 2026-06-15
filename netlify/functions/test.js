exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  // 1. API 키 확인
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 200, headers, body: JSON.stringify({ step: 'FAIL', reason: 'ANTHROPIC_API_KEY 환경변수 없음' }) };
  }

  // 2. Anthropic API 최소 호출 테스트
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{ role: 'user', content: '안녕' }] })
    });

    const text = await res.text();
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ step: 'OK', httpStatus: res.status, apiKeyPrefix: apiKey.slice(0, 12) + '...', responsePreview: text.slice(0, 300) })
    };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ step: 'FETCH_ERROR', reason: err.message }) };
  }
};
