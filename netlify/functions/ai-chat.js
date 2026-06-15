const PROJECT_CONTEXT = `
GreenCycle - школьный научный проект из Алматы: мобильная система аэробного компостирования органических отходов на солнечной энергии.
Авторы: Алмен Магжан и Мыңжасар Магжан, 8 класс, школа им. Шоқана Уалиханова.
Система состоит из мобильного бака со шредером, габионного компостера с естественной аэрацией и энергетического модуля.
Эксперимент: 50 кг органических отходов за 40 дней; объём после измельчения сокращается примерно в 2,5 раза; готовый биогумус составляет около 50% исходной массы.
Экологический смысл: аэробное компостирование почти исключает образование метана и может снизить выбросы на 85-95% по сравнению с анаэробным разложением на полигоне.
Стоимость: 105 000 тенге автономная версия с солнечной станцией, 40 000 тенге базовая версия от электросети.
`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(500, { error: "OPENAI_API_KEY is not configured" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
  const safeMessages = messages
    .filter((message) => message && ["user", "assistant"].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 1200)
    }));

  if (!safeMessages.length) {
    return json(400, { error: "Message is required" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        reasoning: { effort: "low" },
        instructions: [
          "Ты дружелюбный русскоязычный ИИ-помощник сайта GreenCycle.",
          "Отвечай кратко, понятно и по делу.",
          "Если вопрос про проект, опирайся на контекст ниже.",
          "Если данных не хватает, честно скажи, что это нужно уточнить у авторов.",
          PROJECT_CONTEXT
        ].join("\\n\\n"),
        input: safeMessages
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return json(response.status, { error: data.error?.message || "OpenAI request failed" });
    }

    return json(200, { reply: data.output_text || "Не получилось сформировать ответ." });
  } catch {
    return json(500, { error: "AI service is unavailable" });
  }
};

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  };
}
