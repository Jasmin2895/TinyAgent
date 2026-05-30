// 02-streaming/stream.js
// Usage: ANTHROPIC_API_KEY=sk-... node stream.js "your prompt here"

const prompt = process.argv[2] ?? "Count to 10, slowly.";

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    stream: true,
    messages: [{ role: "user", content: prompt }],
  }),
});

const decoder = new TextDecoder();
let buffer = "";

for await (const chunk of response.body) {
  buffer += decoder.decode(chunk, { stream: true });

  const messages = buffer.split("\n\n");
  buffer = messages.pop();

  for (const message of messages) {
    const dataLine = message.split("\n").find(l => l.startsWith("data: "));
    if (!dataLine) continue;

    const data = JSON.parse(dataLine.slice(6));

    if (data.type === "content_block_delta") {
      process.stdout.write(data.delta.text);
    }

    if (data.type === "message_delta") {
      process.stderr.write(`\n\n[stop_reason: ${data.delta.stop_reason}]\n`);
    }
  }
}
