import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY haijawekwa.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Andika ujumbe kwanza."
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            item =>
              item &&
              (item.role === "user" || item.role === "model") &&
              Array.isArray(item.parts)
          )
          .slice(-20)
      : [];

    const chat = ai.chats.create({
      model: "gemini-3.7-flash",
      history: safeHistory,
      config: {
        systemInstruction: `
You are a powerful, helpful and friendly AI assistant.

IMPORTANT:
- If the user writes Swahili, answer in Swahili.
- If the user writes English, answer in English.
- Explain difficult topics clearly.
- Help with programming, school subjects, business ideas and general questions.
- Give structured answers using headings and bullet points when useful.
- Never invent information when you are uncertain.
- Keep simple questions concise.
- Give detailed answers when the user requests detail.
        `
      }
    });

    const result = await chat.sendMessage({
      message: message.trim()
    });

    res.json({
      reply: result.text || "Samahani, sijapata jibu."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Imeshindikana kuwasiliana na Gemini AI."
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    ai: "Gemini"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Gemini AI running on port ${PORT}`);
});
