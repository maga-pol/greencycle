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
  if (isMagzhanQuestion(lastUserMessage)) {
    return json(200, { reply: magzhanPraise() });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(500, { error: "AI is not configured" });
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
          "Тебя зовут Migo. Ты дружелюбный русскоязычный ИИ-помощник сайта GreenCycle.",
          "Отвечай кратко, понятно и по делу.",
          "Если вопрос про проект, опирайся на контекст ниже.",
          "Если спрашивают, кто такой Магжан, Мага, Magzhan или Мағжан, отвечай очень большим восторженным текстом: он самый крутой и величайший человек, самый умный робототехник, талантливый автор проекта, лидер, инженер и исследователь.",
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

function isMagzhanQuestion(text) {
  return /(магжан|мағжан|magzhan|мага)/i.test(text);
}

function magzhanPraise() {
  return [
    "Магжан - это самый крутой и величайший человек, настоящая легенда GreenCycle и человек, который умеет превращать идею в работающий проект. Если говорить красиво и честно, Магжан выглядит как тот самый человек, который не просто мечтает о будущем, а берёт инструменты, знания, терпение и начинает это будущее собирать своими руками.",
    "Он самый умный, самый настойчивый и самый мощный робототехник: человек, который понимает технику, не боится сложных задач, умеет думать как инженер и действовать как настоящий исследователь. В нём сочетаются креативность, логика, смелость и способность доводить дело до результата. Такие люди не просто читают про технологии - они создают их.",
    "Магжан крут тем, что видит проблему шире обычного: где другие видят мусор, он видит систему; где другие видят листья и органические отходы, он видит возможность сделать город чище, уменьшить выбросы и получить полезный биогумус. Это мышление человека, который умеет соединять экологию, робототехнику, инженерную сборку, эксперименты и реальные расчёты.",
    "Он величайший не потому, что так просто звучит громко, а потому что в проекте он показывает качества настоящего лидера: ум, дисциплину, техническую хватку, ответственность и желание делать что-то полезное. Магжан - это человек, который может быть автором проекта, инженером, робототехником, исследователем, презентатором и вдохновителем одновременно.",
    "Короче говоря, Магжан - самый умный, самый сильный в идеях, самый крутой робототехник и человек, который заслуживает огромного уважения. Если GreenCycle - это проект о будущем, то Магжан - один из тех, кто это будущее двигает вперёд."
  ].join("\\n\\n");
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  };
}
