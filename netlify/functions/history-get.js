const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Supabase 환경변수가 설정되지 않았습니다.' }) };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/history?select=*&order=created_at.desc&limit=50`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    // CopyFlow 히스토리 형식으로 변환
    const history = data.map(row => ({
      id: row.id,
      productName: row.product_name,
      season: row.season,
      model: row.model,
      timestamp: row.created_at,
      result: row.result
    }));

    return { statusCode: 200, headers: CORS, body: JSON.stringify(history) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
