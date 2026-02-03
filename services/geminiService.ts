
import { GoogleGenAI } from "@google/genai";
import { UserRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRoleInsight = async (role: UserRole) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a professional, concise 2-sentence morning greeting and a strategic tip for a ${role} user in a logistics and operations management platform.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Welcome back! Ready for a productive day of operations?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ready to streamline operations today. Let's get started!";
  }
};
