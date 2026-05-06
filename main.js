const apiKeyInput = document.querySelector("#apiKeyInput");
const modelSelect = document.querySelector("#modelSelect");
const saveKeyButton = document.querySelector("#saveKeyButton");
const clearChatButton = document.querySelector("#clearChatButton");
const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");

const STORAGE_KEY = "ai-chat-openai-key";
const MODEL_KEY = "ai-chat-model";

const messages = [
  {
    role: "assistant",
    content: "안녕하세요. 무엇을 도와드릴까요?",
  },
];

function loadSettings() {
  const savedKey = sessionStorage.getItem(STORAGE_KEY);
  const savedModel = localStorage.getItem(MODEL_KEY);

  if (savedKey) {
    apiKeyInput.value = savedKey;
  }

  if (savedModel && [...modelSelect.options].some((option) => option.value === savedModel)) {
    modelSelect.value = savedModel;
  }
}

function saveSettings() {
  const apiKey = apiKeyInput.value.trim();

  if (apiKey) {
    sessionStorage.setItem(STORAGE_KEY, apiKey);
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  localStorage.setItem(MODEL_KEY, modelSelect.value);
  showStatus(apiKey ? "API 키가 세션에 저장되었습니다." : "저장된 API 키를 삭제했습니다.");
}

function showStatus(text) {
  const existing = document.querySelector(".status-message");

  if (existing) {
    existing.remove();
  }

  const status = document.createElement("p");
  status.className = "status-message";
  status.textContent = text;
  chatLog.append(status);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function renderMessages() {
  chatLog.innerHTML = "";

  messages.forEach((message) => {
    const bubble = document.createElement("article");
    bubble.className = `message ${message.role}`;

    const meta = document.createElement("span");
    meta.className = "message-meta";
    meta.textContent = message.role === "user" ? "나" : "AI";

    const content = document.createElement("p");
    content.textContent = message.content;

    bubble.append(meta, content);
    chatLog.append(bubble);
  });

  chatLog.scrollTop = chatLog.scrollHeight;
}

function setLoading(isLoading) {
  sendButton.disabled = isLoading;
  messageInput.disabled = isLoading;
  sendButton.textContent = isLoading ? "응답 중" : "전송";
}

function buildInput() {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
  }));
}

function getResponseText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const output = data.output || [];
  const textParts = [];

  output.forEach((item) => {
    (item.content || []).forEach((content) => {
      if (content.type === "output_text" && content.text) {
        textParts.push(content.text);
      }
    });
  });

  return textParts.join("\n").trim() || "응답 텍스트를 찾지 못했습니다.";
}

async function requestAiResponse() {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    throw new Error("API 키를 먼저 입력하세요.");
  }

  sessionStorage.setItem(STORAGE_KEY, apiKey);
  localStorage.setItem(MODEL_KEY, modelSelect.value);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelSelect.value,
      instructions: "You are a concise, helpful Korean AI chat assistant.",
      input: buildInput(),
      max_output_tokens: 1200,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error?.message || `요청에 실패했습니다. HTTP ${response.status}`;
    throw new Error(message);
  }

  return getResponseText(data);
}

async function handleSubmit(event) {
  event.preventDefault();

  const text = messageInput.value.trim();

  if (!text) return;

  messages.push({ role: "user", content: text });
  messageInput.value = "";
  renderMessages();
  setLoading(true);

  try {
    const answer = await requestAiResponse();
    messages.push({ role: "assistant", content: answer });
  } catch (error) {
    messages.push({
      role: "assistant",
      content: `오류: ${error.message}`,
    });
  } finally {
    renderMessages();
    setLoading(false);
    messageInput.focus();
  }
}

function clearChat() {
  messages.splice(0, messages.length, {
    role: "assistant",
    content: "새 대화를 시작합니다.",
  });
  renderMessages();
  messageInput.focus();
}

saveKeyButton.addEventListener("click", saveSettings);
modelSelect.addEventListener("change", () => localStorage.setItem(MODEL_KEY, modelSelect.value));
clearChatButton.addEventListener("click", clearChat);
chatForm.addEventListener("submit", handleSubmit);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    chatForm.requestSubmit();
  }
});

loadSettings();
renderMessages();
