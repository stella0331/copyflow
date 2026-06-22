const { getDeployStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  try {
    const store = getDeployStore('copyflow-history');
    const raw = await store.get('history');
    const history = raw ? JSON.parse(raw) : [];
    return { statusCode: 200, headers: CORS, body: JSON.stringify(history) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
