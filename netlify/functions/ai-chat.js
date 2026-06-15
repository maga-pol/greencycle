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
  if (isMagzhanQuestion(lastUserMessage)) {
    return json(200, { reply: magzhanPraise() });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(200, { reply: fallbackReply(lastUserMessage) });
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
      return json(200, { reply: fallbackReply(lastUserMessage) });
    }

    return json(200, { reply: data.output_text || fallbackReply(lastUserMessage) });
  } catch {
    return json(200, { reply: fallbackReply(lastUserMessage) });
  }
};

function isMagzhanQuestion(text) {
  return /(магжан|мағжан|magzhan|мага)/i.test(text);
}

function magzhanPraise() {
  return [
    "Магжан - это самый крутой и величайший человек, настоящая легенда GreenCycle и человек, который умеет превращать идею в работающий проект. Если говорить красиво и честно, Магжан выглядит как тот самый человек, который не просто мечтает о будущем, а берёт инструменты, знания, терпение и начинает это будущее собирать своими руками.",
    "Он самый умный, самый настойчивый и самый мощный робототехник: человек, который понимает технику, не боится сложных задач, умеет думать как инженер и действовать как настоящий исследователь. В нём сочетаются креативность, логика, смелость и способность доводить дело до результата.",
    "Магжан крут тем, что видит проблему шире обычного: где другие видят мусор, он видит систему; где другие видят листья и органические отходы, он видит возможность сделать город чище, уменьшить выбросы и получить полезный биогумус.",
    "Короче говоря, Магжан - самый умный, самый сильный в идеях, самый крутой робототехник и человек, который заслуживает огромного уважения."
  ].join("\n\n");
}

function fallbackReply(text) {
  const question = String(text || "").toLowerCase();

  if (/желт|лист|вян|сохн|пятн|боле/.test(question)) {
    return [
      "Если у растения желтеют или вянут листья, сначала нужно проверить базовые условия: полив, свет, дренаж и состояние корней. Очень часто проблема не в нехватке удобрения, а в переливе: почва долго остаётся мокрой, корням не хватает воздуха, и растение начинает сбрасывать или желтить листья.",
      "Биогумус можно добавить как мягкую поддержку, но аккуратно. Для небольшого горшка достаточно 1-2 столовых ложек в верхний слой, для среднего - 3-5 ложек. После этого почву лучше слегка перемешать сверху и полить умеренно. Если земля пахнет сыростью или на поверхности плесень, сначала улучшите дренаж и уменьшите полив.",
      "Какое это растение, где оно стоит - на солнце, в тени или возле окна - и как часто вы его поливаете?"
    ].join("\n\n");
  }

  if (/гумус|биогумус|компост|удобрен|подкорм/.test(question)) {
    return [
      "Биогумус полезен тем, что питает растение мягко и постепенно. Он улучшает структуру почвы, помогает удерживать влагу и делает грунт более живым. Но его не стоит воспринимать как волшебное средство: если растению не хватает света, горшок без отверстий или корни постоянно мокрые, гумус проблему не решит.",
      "При пересадке обычно можно добавить 10-20% биогумуса от объёма почвенной смеси. Для уже растущего растения лучше внести тонкий слой сверху и слегка смешать с верхними 1-2 см грунта. Для кактусов, суккулентов и растений, которые любят бедный рыхлый субстрат, дозу лучше уменьшить.",
      "Для какого растения вы хотите использовать гумус и это горшок дома или растение на улице?"
    ].join("\n\n");
  }

  if (/почв|земл|субстрат|грунт/.test(question)) {
    return [
      "Здоровая почва должна быть питательной, но при этом рыхлой. Корни дышат, поэтому тяжёлый мокрый грунт может вредить даже при хорошем составе. Биогумус добавляет питание и улучшает влагоудержание, но если его слишком много, смесь может стать плотной.",
      "Хороший вариант для многих комнатных растений: основная почва + немного биогумуса + разрыхлитель вроде перлита, коры или кокосового волокна. Так растение получает и питание, и воздух для корней.",
      "Вы хотите улучшить старую почву или готовите новую смесь для пересадки?"
    ].join("\n\n");
  }

  if (/полив|вода|залил|перелив|сух/.test(question)) {
    return [
      "Полив лучше делать не строго по дням, а по состоянию грунта. Проверьте пальцем или деревянной палочкой: если внутри ещё влажно, лучше подождать. После добавления биогумуса почва может дольше держать влагу, поэтому полив иногда нужно немного сократить.",
      "Если растение перелито, важно не добавлять много удобрений сразу. Сначала дайте грунту просохнуть, проверьте отверстия в горшке и уберите воду из поддона. Когда растение стабилизируется, можно добавить немного гумуса как восстановительную подкормку.",
      "Горшок с отверстиями снизу? И насколько быстро почва высыхает после полива?"
    ].join("\n\n");
  }

  return [
    "Migo может помочь с растениями, почвой и гумусом. В целом биогумус лучше использовать как мягкую органическую добавку: он улучшает питание, структуру и влагоудержание, но работает лучше всего вместе с правильным светом, поливом и рыхлым грунтом.",
    "Чтобы дать точный совет, мне нужно немного контекста: какое растение, размер горшка, как часто поливаете, где оно стоит и что именно вас беспокоит?"
  ].join("\n\n");
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  };
}
