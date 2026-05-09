const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.4-mini";
const MAX_BODY_BYTES = 128 * 1024;

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders,
  });
}

function extractResponseText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const textParts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        textParts.push(content.text);
      }
    }
  }

  return textParts.join("\n").trim() || "응답 텍스트를 찾지 못했습니다.";
}

async function readJson(request) {
  const contentLength = Number(request.headers.get("Content-Length") || "0");
  if (contentLength <= 0) {
    throw new Error("요청 본문이 비어 있습니다.");
  }
  if (contentLength > MAX_BODY_BYTES) {
    throw new Error("요청이 너무 큽니다.");
  }

  const payload = await request.json();
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("JSON 객체를 보내야 합니다.");
  }
  return payload;
}

async function callOpenAI(payload, env) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("서버에 OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.");
  }

  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    const error = new Error("messages 배열이 필요합니다.");
    error.status = 400;
    throw error;
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: payload.model || env.OPENAI_MODEL || DEFAULT_MODEL,
      instructions: "You are a concise, helpful Korean AI chat assistant.",
      input: payload.messages,
      max_output_tokens: 1200,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error?.message || `OpenAI 요청 실패: HTTP ${response.status}`;
    const error = new Error(message);
    error.status = 502;
    throw error;
  }

  return { text: extractResponseText(data) };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

export async function onRequestPost({ request, env }) {
  try {
    const payload = await readJson(request);
    const result = await callOpenAI(payload, env);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: error.message || "요청 처리 중 오류가 발생했습니다." }, error.status || 502);
  }
}
