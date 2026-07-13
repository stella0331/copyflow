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
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: { message: 'GEMINI_API_KEY가 Netlify 환경변수에 설정되지 않았습니다.' } })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: '요청 형식이 잘못되었습니다.' }) };
  }

  const { model = 'gemini-2.5-flash-latest', ...payload } = body;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    if (!text || text.trim() === '') {
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: { message: 'Gemini API에서 빈 응답이 왔습니다.' } }) };
    }

    return { statusCode: res.status, headers: CORS, body: text };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: { message: err.message } }) };
  }
};
