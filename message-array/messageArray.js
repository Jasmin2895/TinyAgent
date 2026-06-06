import readline from "node:readline";

const strategy = (process.argv.find(a => a.startsWith("--strategy="))
                  ?.split("=")[1]) ?? "full";

const messages = [];
let turn = 0, inTokens = 0, outTokens = 0;

function prepare() {
  if (strategy === "window") return messages.slice(-10); // last 5 turns
  return messages;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask() {
  rl.question("you: ", async (text) => {
    if (!text.trim()) return ask();
    if (text === "/exit") return rl.close();

    messages.push({ role: "user", content: text });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        messages: prepare(),
      }),
    });

    const data = await res.json();
    const reply = data.content[0].text;
    messages.push({ role: "assistant", content: reply });

    turn += 1;
    inTokens  += data.usage.input_tokens;
    outTokens += data.usage.output_tokens;
    const cost = (inTokens / 1e6) * 3 + (outTokens / 1e6) * 15;

    console.log(`\nclaude: ${reply}`);
    console.log(`[turn ${turn} · ${inTokens} in / ${outTokens} out · $${cost.toFixed(4)}]\n`);
    ask();
  });
}

ask();