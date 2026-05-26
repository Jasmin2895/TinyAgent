const API_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = process.env.ANTHROPIC_API_KEY;
const PRICE_IN = 3, PRICE_OUT = 15;  // $ per 1M tokens — check your provider

async function ask(userMessage, { system, model = "claude-opus-4-7" } = {}) {
  const body = {
    model, max_tokens: 1024,
    messages: [{ role: "user", content: userMessage }],
    ...(system && { system }),
  };
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

  const data = await res.json();
  const text = data.content.find(b => b.type === "text")?.text ?? "";
  const { input_tokens, output_tokens } = data.usage;
  const cost = (input_tokens * PRICE_IN + output_tokens * PRICE_OUT) / 1e6;

  return { text, usage: data.usage, cost, stop_reason: data.stop_reason };
}

const r = await ask("Explain HTTP in one sentence.", { system: "Be concise." });
console.log(r.text);
console.log(`tokens: ${r.usage.input_tokens} in / ${r.usage.output_tokens} out`);
console.log(`cost:   $${r.cost.toFixed(6)}   stop: ${r.stop_reason}`);
