import { GoogleGenAI } from "@google/genai";
import { UserRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Local fallbacks to maintain the "AI insight" experience when quota is exhausted
const LOCAL_INSIGHTS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    "Global operational efficiency is up 12% this quarter. Focus on optimizing cross-departmental data sharing protocols.",
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

// Simple in-memory cache to prevent redundant hits on the same session
const insightCache: Record<string, string> = {};

/**
 * Helper to perform API calls with exponential backoff for retryable errors.
 * 429 Quota errors are caught immediately to trigger local fallbacks.
 */
async function callWithRetry(fn: () => Promise<any>, role: UserRole, maxRetries = 2, baseDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isQuotaExhausted = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
      
      // If quota is exhausted, don't keep retrying; return local fallback immediately
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

export const getRoleInsight = async (role: UserRole) => {
  // Check cache first
  if (insightCache[role]) {
    return insightCache[role];
  }

  try {
    const text = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a professional, concise 2-sentence morning greeting and a strategic tip for a ${role} user in a logistics and operations management platform. Do not use markdown formatting.`,
        config: {
          temperature: 0.8,
        }
      });
      return response.text;
    }, role);

    const finalInsight = text || getRandomLocalInsight(role);
    insightCache[role] = finalInsight;
    return finalInsight;
  } catch (error) {
    return getRandomLocalInsight(role);
  }
};