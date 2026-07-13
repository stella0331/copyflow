const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: { message: 'Method Not Allowed' } }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY가 Netlify 환경변수에 설정되지 않았습니다.' } })
    };
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: { message: '요청 형식이 잘못되었습니다.' } }) };
  }

  const bodySize = Buffer.byteLength(event.body || '', 'utf8');
  if (bodySize > 4 * 1024 * 1024) {
    return {
      statusCode: 413,
      headers: CORS,
      body: JSON.stringify({ error: { message: `요청 크기가 너무 큽니다 (${(bodySize / 1024 / 1024).toFixed(1)}MB). 이미지 장수를 줄여주세요.` } })
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(parsedBody)
    });

    const text = await response.text();

    if (!text || text.trim() === '') {
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: { message: 'Anthropic API에서 빈 응답이 왔습니다. 잠시 후 다시 시도해주세요.' } }) };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { statusCode: 502, headers: CORS, body:
