const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatMessages = document.querySelector("#chatMessages");
const chatStatus = document.querySelector("#chatStatus");
const promptButtons = document.querySelectorAll("[data-prompt]");

const messages = [];

function addMessage(role, text) {
  const item = document.createElement("div");
  item.className = `message ${role}`;
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  item.append(paragraph);
  chatMessages.append(item);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage(text) {
  const question = text.trim();
  if (!question) return;

  addMessage("user", question);
  messages.push({ role: "user", content: question });
  chatInput.value = "";
  chatStatus.textContent = "Migo думает...";

  try {
    const response = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages.slice(-8) })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Не удалось получить ответ.");
    }

    addMessage("assistant", data.reply);
    messages.push({ role: "assistant", content: data.reply });
    chatStatus.textContent = "Готово. Можно задать следующий вопрос.";
  } catch (error) {
    addMessage("assistant", getFriendlyError(error.message));
    chatStatus.textContent = "Онлайн-ответ временно недоступен.";
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(chatInput.value);
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage(chatInput.value);
  }
});

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    chatInput.value = button.dataset.prompt;
    chatInput.focus();
  });
});

function getFriendlyError(message) {
  const text = String(message || "").toLowerCase();

  if (text.includes("not configured")) {
    return "Migo не видит ключ OpenAI в Vercel. Проверьте, что переменная называется OPENAI_API_KEY, сохранена для Production и после этого был сделан Redeploy.";
  }

  if (text.includes("incorrect api key") || text.includes("invalid api key") || text.includes("unauthorized")) {
    return "Migo подключился к OpenAI, но ключ не принят. Проверьте, что в Vercel вставлен именно OpenAI API key из platform.openai.com, обычно он начинается с sk- или sk-proj-.";
  }

  if (text.includes("model")) {
    return "Migo подключился к OpenAI, но модель не доступна для этого ключа. В Vercel можно добавить OPENAI_MODEL со значением gpt-5.4-mini или заменить модель в коде.";
  }

  return "Migo сейчас не смог подключиться к онлайн-ИИ. Проверьте ключ OpenAI в Vercel, сделайте Redeploy и попробуйте ещё раз.";
}
