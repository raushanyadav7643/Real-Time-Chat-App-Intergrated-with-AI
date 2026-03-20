import OpenAI from "openai";

export const askAI = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    // If user has provided an OpenAI key in .env, use OpenAI
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant integrated into a real-time chat application." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
      });
      return res.status(200).json({ response: response.choices[0].message.content });
    }

    // Use High-IQ configuration for DEEP, CORRECT, and ADVANCED responses
    const expertAiUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&system=You are an ultra-advanced AI researcher with 100% accuracy. For any question, think logically and provide a detailed, expert-level correct answer. Never hallucinate. Act as an expert senior professor in every field.`;

    const response = await fetch(expertAiUrl);
    const rawText = await response.text();

    // PARSE JSON Logic: Handle models that return structured objects/reasoning
    try {
      if (rawText.trim().startsWith("{")) {
        const json = JSON.parse(rawText);
        const finalContent = json.content ||
          json.choices?.[0]?.message?.content ||
          json.choices?.[0]?.text ||
          (json.reasoning_content ? `${json.reasoning_content}\n\n${json.content || ""}` : rawText);

        if (finalContent && finalContent.length > 5) {
          return res.status(200).json({ response: finalContent });
        }
      }
    } catch (e) { /* Fallback to raw text if not JSON */ }

    if (rawText.includes("error") || rawText.length < 10) {
      // Multi-stage fallback for maximum correctness
      const fallbackRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt + " (Explain as an expert senior researcher correctly in detail)")}`);
      const result = await fallbackRes.text();
      return res.status(200).json({ response: result });
    }

    res.status(200).json({ response: rawText });
  } catch (error) {
    console.error("AI Assistant Error:", error);
    res.status(500).json({ message: "Error communicating with AI Assistant", error: error.message });
  }
};
