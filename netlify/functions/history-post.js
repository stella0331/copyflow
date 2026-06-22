const { getStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const HISTORY_MAX = 50;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const { action, entry, id } = JSON.parse(event.body || '{}');
    const store = getStore('copyflow-history');
    const raw = await store.get('history');
    let history = raw ? JSON.parse(raw) : [];

    if (action === 'add') {
      history.unshift({ ...entry, id: Date.now() });
      if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
    } else if (action === 'delete') {
      history = history.filter(h => h.id !== id);
    } else if (action === 'clear') {
      history = [];
    }

    await store.set('history', JSON.stringify(history));
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
