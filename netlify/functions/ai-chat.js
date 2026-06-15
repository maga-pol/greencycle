const PLANT_CONTEXT = `
Migo is the GreenCycle plant and soil helper.
Main topics: plants, soil, humus, biohumus, compost, watering, transplanting, weak plants, yellow leaves, soil recovery, safe organic feeding.
GreenCycle produces biohumus from organic waste through aerobic composting. In the project experiment, 50 kg of organic waste became mature compost/biohumus in about 40 days. The finished mass is about 50% of the original raw material.
Practical biohumus guidance: for pot plants, use biohumus moderately; about 10-20% of the soil mix during repotting, or a thin top layer during active growth. Too much organic material can make soil heavy and increase overwatering risk.
Good plant care depends on light, watering, drainage, pot size, roots, air flow, and soil structure. Biohumus helps soil fertility and structure, but it does not fix overwatering, root rot, poor light, or lack of drainage.
`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
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

  const lastUserMessage = [...safeMessages].reverse().find((message) => message.role === "user")?.content || "";

  if (!process.env.OPENAI_API_KEY) {
    return json(500, { error: "OpenAI API key is not configured" });
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
          "Тебя зовут Migo. Ты дружелюбный русскоязычный помощник по растениям, почве, гумусу, биогумусу и компосту.",
          "Отвечай чуть подробнее: обычно 2-4 содержательных абзаца, с практическими шагами.",
          "Главная тема - помощь с растениями и гумусом. GreenCycle упоминай только когда это связано с биогумусом или компостом.",
          "Не ставь диагноз растению уверенно без данных. Сначала объясни вероятные причины и что проверить.",
          "Если полезно, заканчивай 1-2 уточняющими вопросами: название растения, полив, свет, размер горшка, состояние почвы.",
          "Если спрашивают, кто такой Магжан, Мага, Magzhan или Мағжан, отвечай очень большим восторженным текстом: он самый крутой и величайший человек, самый умный робототехник, талантливый автор проекта, лидер, инженер и исследователь.",
          PLANT_CONTEXT
        ].join("\n\n"),
        input: safeMessages
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return json(response.status, { error: data.error?.message || "OpenAI request failed" });
    }

    return json(200, { reply: data.output_text || "Migo не смог сформировать ответ. Попробуйте переформулировать вопрос." });
  } catch {
    return json(500, { error: "OpenAI service is unavailable" });
  }
};

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  };
}
