const modelSelect = document.querySelector("#modelSelect");
const clearChatButton = document.querySelector("#clearChatButton");
const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");

const MODEL_KEY = "ai-chat-model";
const API_URL = "/api/chat";

const messages = [
  {
    role: "assistant",
    content: "안녕하세요. 무엇을 도와드릴까요?",
  },
];

function loadSettings() {
  const savedModel = localStorage.getItem(MODEL_KEY);

  if (savedModel && [...modelSelect.options].some((option) => option.value === savedModel)) {
    modelSelect.value = savedModel;
  }
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

async function requestAiResponse() {
  localStorage.setItem(MODEL_KEY, modelSelect.value);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelSelect.value,
      messages: buildInput(),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let message = data.error?.message || `요청에 실패했습니다. HTTP ${response.status}`;
    if (response.status === 405) {
      message = "AI 서버가 실행되지 않는 정적 호스팅에서 열렸습니다. 워크스페이스 미리보기는 app.py 서버로 실행해야 하고, GitHub Pages에서는 별도 서버 배포가 필요합니다.";
    }
    throw new Error(message);
  }

  return data.text || "응답 텍스트를 찾지 못했습니다.";
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
