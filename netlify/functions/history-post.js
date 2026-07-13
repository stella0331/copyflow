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

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Supabase 환경변수가 설정되지 않았습니다.' }) };
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  try {
    const { action, entry, id } = JSON.parse(event.body || '{}');

    if (action === 'add') {
      // 행 수 50개 초과 시 오래된 것 삭제
      const countRes = await fetch(`${SUPABASE_URL}/rest/v1/history?select=id&order=created_at.asc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const rows = await countRes.json();
      if (rows.length >= 50) {
        const deleteIds = rows.slice(0, rows.length - 49).map(r => r.id);
        await fetch(`${SUPABASE_URL}/rest/v1/history?id=in.(${deleteIds.join(',')})`, {
          method: 'DELETE',
          headers
        });
      }

      // 새 항목 삽입
      const res = await fetch(`${SUPABASE_URL}/rest/v1/history`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product_name: entry.productName,
          season: entry.season,
          model: entry.model,
          thumbnails: entry.thumbnails || [],
          result: entry.result
        })
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

    } else if (action === 'delete') {
      await fetch(`${SUPABASE_URL}/rest/v1/history?id=eq.${id}`, {
        method: 'DELETE',
        headers
      });

    } else if (action === 'clear') {
      await fetch(`${SUPABASE_URL}/rest/v1/history?id=gte.0`, {
        method: 'DELETE',
        headers
      });
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
