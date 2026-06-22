export default async (request, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Method Not Allowed' } }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' } }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: { message: '요청 형식이 잘못되었습니다.' } }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Anthropic API에 스트리밍 요청
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'output-128k-2025-02-19'
    },
    body: JSON.stringify({
      ...body,
      stream: true
    })
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return new Response(err, {
      status: anthropicRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // SSE 스트림을 파싱해서 전체 텍스트를 모아 JSON으로 반환
  const reader = anthropicRes.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let inputTokens = 0, outputTokens = 0;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                fullText += event.delta.text;
              }
              if (event.type === 'message_delta' && event.usage) {
                outputTokens = event.usage.output_tokens;
              }
              if (event.type === 'message_start' && event.message?.usage) {
                inputTokens = event.message.usage.input_tokens;
              }
            } catch (_) {}
          }
        }

        // 스트림이 끝나면 완성된 응답을 Messages API 포맷으로 반환
        const response = JSON.stringify({
          content: [{ type: 'text', text: fullText }],
          usage: { input_tokens: inputTokens, output_tokens: outputTokens }
        });
        controller.enqueue(new TextEncoder().encode(response));
      } catch (err) {
        controller.enqueue(new TextEncoder().encode(
          JSON.stringify({ error: { message: err.message } })
        ));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/claude' };
