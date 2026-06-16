const PLANT_CONTEXT = `
Migo is the GreenCycle plant and soil helper.
Main topics: plants, soil, humus, biohumus, compost, watering, transplanting, weak plants, yellow leaves, soil recovery, safe organic feeding.
GreenCycle produces biohumus from organic waste through aerobic composting. In the project experiment, 50 kg of organic waste became mature compost/biohumus in about 40 days. The finished mass is about 50% of the original raw material.
Practical biohumus guidance: for pot plants, use biohumus moderately; about 10-20% of the soil mix during repotting, or a thin top layer during active growth. Too much organic material can make soil heavy and increase overwatering risk.
Good plant care depends on light, watering, drainage, pot size, roots, air flow, and soil structure. Biohumus helps soil fertility and structure, but it does not fix overwatering, root rot, poor light, or lack of drainage.
If a user asks for exact local laws, prices, scientific statistics, current dates, medical advice, or anything outside plant care, say that you cannot reliably confirm it here and keep the answer focused on plant/soil guidance.
`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
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
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
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
              "Тебя зовут Migo. Ты русскоязычный помощник GreenCycle только по растениям, почве, гумусу, биогумусу, компосту, поливу, пересадке и восстановлению слабых растений.",
              "Отвечай по делу. Не уходи в общие рассуждения, рекламу, длинные вступления или темы, которых пользователь не спрашивал.",
              "Если вопрос не относится к растениям, почве, компосту или биогумусу, коротко скажи, что можешь помочь только по этим темам, и предложи переформулировать вопрос.",
              "Не выдумывай факты, цифры, законы, цены, адреса, исследования и точные диагнозы. Если данных не хватает, честно скажи, что это предположение.",
              "Для проблем с растением отвечай в таком порядке: 1) наиболее вероятные причины, 2) что проверить прямо сейчас, 3) что сделать безопасно, 4) когда нужен специалист или пересадка.",
              "Если пользователь спрашивает про дозировку биогумуса, давай осторожные нормы: обычно 10-20% от объема почвосмеси при пересадке или тонкий верхний слой, без перекорма.",
              "GreenCycle упоминай только когда это связано с биогумусом, компостом или переработкой органических отходов.",
              "Пиши простым языком, обычно 3-6 коротких абзацев или короткий список. В конце задай максимум 1-2 уточняющих вопроса только если они реально нужны.",
              PLANT_CONTEXT
            ].join("\n\n")
          }]
        },
        contents: safeMessages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }]
        })),
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 700
        }
      })
    });

    const responseText = await response.text();
    let data = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { error: { message: responseText || "Gemini returned an empty response" } };
    }
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
  } catch (error) {
    console.error("Gemini service error:", error);
    return res.status(500).json({ error: error?.message || "Gemini service is unavailable" });
  }
};
