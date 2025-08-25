import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 🔹 Helper: safely clean and parse JSON responses
const cleanAndParseJSON = (jsonString) => {
  try {
    if (!jsonString) return [];
    // Remove possible markdown wrappers
    let cleaned = jsonString.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse JSON:", jsonString);
    return []; // return empty instead of crashing
  }
};

// 🔹 Generate glossary terms and definitions
export const generateGlossary = async (req, res) => {
  try {
    const { content } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that identifies key terms in text and provides concise definitions. Return ONLY a JSON array of objects with 'term' and 'definition' properties. No explanations or markdown.",
        },
        {
          role: "user",
          content: `Identify the key terms in this text and provide short definitions for each: ${content}`,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 1024,
    });

    const result = completion.choices[0]?.message?.content;
    const glossary = cleanAndParseJSON(result);

    res.json(glossary);
  } catch (error) {
    console.error("Error generating glossary:", error);
    res.status(500).json({ message: "Failed to generate glossary" });
  }
};

// 🔹 Generate summary
export const generateSummary = async (req, res) => {
  try {
    const { content } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that summarizes text concisely in 1-2 lines. Return ONLY the summary text.",
        },
        {
          role: "user",
          content: `Summarize this text in 1-2 lines: ${content}`,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 100,
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    res.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({ message: "Failed to generate summary" });
  }
};

// 🔹 Suggest tags
export const suggestTags = async (req, res) => {
  try {
    const { content } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that suggests 3-5 relevant tags for a text. Return ONLY a JSON array of strings.",
        },
        {
          role: "user",
          content: `Suggest 3-5 relevant tags for this text: ${content}`,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 100,
    });

    const result = completion.choices[0]?.message?.content;
    const tags = cleanAndParseJSON(result);

    res.json(tags);
  } catch (error) {
    console.error("Error generating tags:", error);
    res.status(500).json({ message: "Failed to generate tags" });
  }
};

// 🔹 Check grammar
export const checkGrammar = async (req, res) => {
  try {
    const { content } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that identifies grammatical errors in text. Return ONLY a JSON array of objects with 'text' (the incorrect text), 'suggestion' (the correction), 'start' and 'end' (character positions).",
        },
        {
          role: "user",
          content: `Identify grammatical errors in this text and provide corrections: ${content}`,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 1024,
    });

    const result = completion.choices[0]?.message?.content;
    const errors = cleanAndParseJSON(result);

    res.json(errors);
  } catch (error) {
    console.error("Error checking grammar:", error);
    res.status(500).json({ message: "Failed to check grammar" });
  }
};

// 🔹 Translate content
export const translateContent = async (req, res) => {
  try {
    const { content, targetLanguage } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that translates text to ${targetLanguage}. Return ONLY the translated text.`,
        },
        {
          role: "user",
          content: `Translate this text to ${targetLanguage}: ${content}`,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 1024,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();
    res.json({ translatedText });
  } catch (error) {
    console.error("Error translating:", error);
    res.status(500).json({ message: "Failed to translate" });
  }
};
