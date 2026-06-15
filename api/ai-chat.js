const PLANT_CONTEXT = `
Migo is the GreenCycle plant and soil helper.
Main topics: plants, soil, humus, biohumus, compost, watering, transplanting, weak plants, yellow leaves, soil recovery, safe organic feeding.
GreenCycle produces biohumus from organic waste through aerobic composting. In the project experiment, 50 kg of organic waste became mature compost/biohumus in about 40 days. The finished mass is about 50% of the original raw material.
Practical biohumus guidance: for pot plants, use biohumus moderately; about 10-20% of the soil mix during repotting, or a thin top layer during active growth. Too much organic material can make soil heavy and increase overwatering risk.
Good plant care depends on light, watering, drainage, pot size, roots, air flow, and soil structure. Biohumus helps soil fertility and structure, but it does not fix overwatering, root rot, poor light, or lack of drainage.
`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const messages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
  const safeMessages = messages
    .filter((message) => message && ["user", "assistant"].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 1200)
    }));

  if (!safeMessages.length) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key is not configured" });
  }

  try {
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: [
              "Тебя зовут Migo. Ты дружелюбный русскоязычный помощник по растениям, почве, гумусу, биогумусу и компосту.",
              "Отвечай чуть подробнее: обычно 2-4 содержательных абзаца, с практическими шагами.",
              "Главная тема - помощь с растениями и гумусом. GreenCycle упоминай только когда это связано с биогумусом или компостом.",
              "Не ставь диагноз растению уверенно без данных. Сначала объясни вероятные причины и что проверить.",
              "Если полезно, заканчивай 1-2 уточняющими вопросами: название растения, полив, свет, размер горшка, состояние почвы.",
              "Если спрашивают, кто такой Магжан, Мага, Magzhan или Мағжан, отвечай очень большим восторженным текстом: он самый крутой и величайший человек, самый умный робототехник, талантливый автор проекта, лидер, инженер и исследователь.",
              PLANT_CONTEXT
            ].join("\n\n")
          }]
        },
        contents: safeMessages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }]
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 900
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Gemini request failed" });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    return res.status(200).json({
      reply: reply || "Migo не смог сформировать ответ. Попробуйте переформулировать вопрос."
    });
  } catch {
    return res.status(500).json({ error: "Gemini service is unavailable" });
  }
};
