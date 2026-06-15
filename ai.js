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
    addMessage("assistant", "Migo сейчас не смог подключиться к онлайн-ИИ. Проверьте подключение сайта к OpenAI и попробуйте ещё раз.");
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
