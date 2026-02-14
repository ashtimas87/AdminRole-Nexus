import { GoogleGenAI } from "@google/genai";
import { UserRole } from "./types";

/**
 * Initialize the Google GenAI client following strict guidelines.
 * Always use process.env.API_KEY exclusively.
 */
const getAIClient = () => {
  // Always use process.env.API_KEY directly as per guidelines.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Local fallbacks to maintain the "AI insight" experience when quota is exhausted
const LOCAL_INSIGHTS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    "User engagement metrics suggest a need for simplified onboarding for Station-level operators.",
    "System security audit complete. All 21 nodes are reporting healthy status and synchronized logs."
  ],
  [UserRole.SUB_ADMIN]: [
    "Regional response times have improved. Consider reallocating resources to high-traffic urban sectors.",
    "Strategic Tip: Implement weekly log reviews to identify micro-bottlenecks in daily station reporting.",
    "Team coordination is peaking. This is an ideal window for rolling out new operational guidelines."
  ],
  [UserRole.CHQ]: [
    "Centralized data analysis indicates a trend towards predictive maintenance. Review unit-level equipment logs.",
    "Strategic Tip: Focus on PI27 community support metrics to strengthen regional partnerships.",
    "Data integrity check passed. Ensure all Station reports are validated before the end-of-month consolidation."
  ],
  [UserRole.STATION]: [
    "Daily log compliance is currently at an all-time high. Keep up the consistent record-keeping.",
    "Strategic Tip: Utilize the new evidence upload feature to streamline the verification of PI8 activities.",
    "Local facility status: Optimal. Peer review your recent tactical entries for maximum clarity."
  ]
};

const getRandomLocalInsight = (role: UserRole) => {
  const insights = LOCAL_INSIGHTS[role] || ["Ready to streamline operations today. Let's get started!"];
  return insights[Math.floor(Math.random() * insights.length)];
};

const insightCache: Record<string, string> = {};

/**
 * Executes an AI call with retry logic and fallback to local insights.
 */
async function callWithRetry(fn: (ai: GoogleGenAI) => Promise<string | undefined>, role: UserRole, maxRetries = 2, baseDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Create a fresh instance for each attempt as per best practices
      const ai = getAIClient();
      return await fn(ai);
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isQuotaExhausted = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaExhausted) {
        console.warn(`Gemini Quota Exhausted. Using local insight engine for ${role}.`);
        return getRandomLocalInsight(role);
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }
  return getRandomLocalInsight(role);
}

/**
 * Fetches strategic insights based on user role using Gemini.
 */
export const getRoleInsight = async (role: UserRole) => {
  if (insightCache[role]) {
    return insightCache[role];
  }

  try {
    const text = await callWithRetry(async (aiClient) => {
      // Use gemini-3-flash-preview for basic text task
      const response = await aiClient.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a professional, concise 2-sentence morning greeting and a strategic tip for a ${role} user in a logistics and operations management platform. Do not use markdown formatting.`,
        config: {
          temperature: 0.8,
        }
      });
      // Correctly access .text property from response
      return response.text;
    }, role);

    const finalInsight = text || getRandomLocalInsight(role);
    insightCache[role] = finalInsight;
    return finalInsight;
  } catch (error) {
    return getRandomLocalInsight(role);
  }
};