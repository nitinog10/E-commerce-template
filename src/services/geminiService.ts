import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getGiftRecommendations(occasion: string, recipient: string, budget: number, interests: string[]) {
  const model = "gemini-3-flash-preview";
  const prompt = `Recommend 5 unique gift ideas for a ${recipient} for a ${occasion}. 
  The budget is around ${budget} INR. 
  Interests: ${interests.join(", ")}.
  Return the recommendations as a JSON array of objects with 'name', 'reason', and 'estimatedPrice' fields.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              reason: { type: Type.STRING },
              estimatedPrice: { type: Type.NUMBER }
            },
            required: ["name", "reason", "estimatedPrice"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}

export async function chatWithAssistant(message: string, history: { role: "user" | "model", parts: { text: string }[] }[]) {
  const model = "gemini-3-flash-preview";
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "You are a helpful gift shop assistant for 'GiftyAI'. You help users find the perfect gift, answer questions about products, and provide shopping advice. Be friendly, creative, and concise.",
    }
  });

  try {
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. How else can I help you?";
  }
}
