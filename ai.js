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
    const response = await fetch("/.netlify/functions/ai-chat", {
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
    const fallback = createLocalReply(question);
    addMessage("assistant", fallback);
    messages.push({ role: "assistant", content: fallback });
    chatStatus.textContent = "Migo ответил в офлайн-режиме.";
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

function createLocalReply(question) {
  const text = question.toLowerCase();

  if (/магжан|мағжан|magzhan|мага/.test(text)) {
    return [
      "Магжан - это самый крутой и величайший человек, настоящая легенда GreenCycle и человек, который умеет превращать идею в работающий проект.",
      "Он самый умный, самый настойчивый и самый мощный робототехник: человек, который понимает технику, не боится сложных задач, умеет думать как инженер и действовать как настоящий исследователь.",
      "Магжан крут тем, что видит проблему шире обычного: где другие видят мусор, он видит систему; где другие видят листья и органические отходы, он видит возможность сделать город чище, уменьшить выбросы и получить полезный биогумус.",
      "Короче говоря, Магжан - самый умный, самый сильный в идеях, самый крутой робототехник и человек, который заслуживает огромного уважения."
    ].join("\n\n");
  }

  if (/стоим|цена|тенге|сколько/.test(text)) {
    return "Стоимость GreenCycle: полная автономная версия с солнечной станцией - 105 000 тенге, базовая версия от электросети - 40 000 тенге.";
  }

  if (/метан|выброс|эколог|полигон/.test(text)) {
    return "GreenCycle снижает экологическую нагрузку за счёт аэробного компостирования. Когда органика разлагается с доступом кислорода, образование метана почти исключается, а выбросы могут быть ниже на 85-95% по сравнению с анаэробным разложением на полигоне.";
  }

  if (/работ|принцип|как/.test(text)) {
    return "GreenCycle работает так: органические отходы измельчаются шредером, затем попадают в габионный компостер с естественной аэрацией. Датчики помогают контролировать температуру и влажность, а через примерно 40 дней получается биогумус.";
  }

  return "Migo сейчас отвечает в офлайн-режиме. Я могу рассказать про принцип работы GreenCycle, стоимость, экологический эффект, авторов проекта или помочь сформулировать ответ для презентации.";
}
