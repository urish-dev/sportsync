import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserPreferences, DailyRecapData, SportEvent, DEFAULT_SCHEDULE_PROMPT, DEFAULT_RECAP_PROMPT } from "../types";

const getAIClient = (apiKey?: string) => {
  // Safe check for API key, prioritizing user input, then environment variable (if available in build)
  // We avoid direct process.env access without checks to prevent browser crashes
  let envKey = "";
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
       // @ts-ignore
       envKey = import.meta.env.VITE_API_KEY;
    } else if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
       envKey = process.env.API_KEY;
    }
  } catch (e) {
    // Ignore env errors
  }

  const key = apiKey || envKey;
  
  if (!key) {
    throw new Error("Missing API Key. Please add your Gemini API Key in Settings.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// Schemas
const eventSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    events: {
      type: Type.ARRAY,
      description: "A list of sports events found for the specified date.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique identifier for the event." },
          sport: { type: Type.STRING, description: "The sport category (e.g., Football, Basketball)." },
          league: { type: Type.STRING, description: "The specific league or tournament name." },
          homeTeam: { type: Type.STRING, description: "The name of the home team or first competitor." },
          awayTeam: { type: Type.STRING, description: "The name of the away team or second competitor." },
          time: { type: Type.STRING, description: "The start time of the event in HH:MM format (Israel Time)." },
          channel: { type: Type.STRING, description: "The TV channel broadcasting the event." },
          status: { type: Type.STRING, enum: ["live", "upcoming", "ended"], description: "The current status relative to the request time." },
        },
        required: ["id", "sport", "league", "time", "channel", "homeTeam", "awayTeam", "status"]
      }
    }
  },
  required: ["events"]
};

const recapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A concise 2-3 sentence summary of the day's major sports news." },
    results: {
      type: Type.ARRAY,
      description: "Key match results from the day.",
      items: {
        type: Type.OBJECT,
        properties: {
          league: { type: Type.STRING, description: "The league or tournament." },
          homeTeam: { type: Type.STRING, description: "Home team name." },
          awayTeam: { type: Type.STRING, description: "Away team name." },
          homeScore: { type: Type.INTEGER, description: "Home team score." },
          awayScore: { type: Type.INTEGER, description: "Away team score." },
          status: { type: Type.STRING, description: "Match status (e.g., 'FT', 'AET')." }
        },
        required: ["league", "homeTeam", "awayTeam", "homeScore", "awayScore", "status"]
      }
    },
    standings: {
      type: Type.ARRAY,
      description: "Snapshot of top standings for a major league.",
      items: {
        type: Type.OBJECT,
        properties: {
          position: { type: Type.INTEGER, description: "Rank position." },
          team: { type: Type.STRING, description: "Team name." },
          played: { type: Type.INTEGER, description: "Matches played." },
          points: { type: Type.INTEGER, description: "Total points." }
        },
        required: ["position", "team", "played", "points"]
      }
    }
  },
  required: ["summary", "results", "standings"]
};

export const fetchSchedule = async (dateStr: string, prefs: UserPreferences): Promise<SportEvent[]> => {
  try {
    const ai = getAIClient(prefs.apiKey);
    const modelName = prefs.geminiModel || "gemini-3-pro-preview";
    
    // Use custom prompt or default
    let prompt = prefs.schedulePrompt || DEFAULT_SCHEDULE_PROMPT;

    // Perform replacements
    prompt = prompt.replace('{{DATE}}', dateStr)
                   .replace('{{SPORTS}}', prefs.selectedSports.join(", "))
                   .replace('{{CHANNELS}}', prefs.selectedChannels.join(", "))
                   .replace('{{LEAGUES}}', prefs.followedLeagues.join(", ") || "None specified (include all major)")
                   .replace('{{TEAMS}}', prefs.favoriteTeams.join(", ") || "None specified");

    // Explicitly append schema structure to prompt to guarantee consistency
    const jsonStructure = JSON.stringify(eventSchema, null, 2);
    prompt += `\n\nCRITICAL OUTPUT INSTRUCTION:\nYour response MUST be a valid JSON object adhering strictly to the following Schema:\n${jsonStructure}`;

    // Only add thinking budget if using a model that supports it (gemini-3-pro) and not flash
    const isThinkingModel = modelName.includes("pro") || modelName.includes("thinking");
    const thinkingConfig = isThinkingModel ? { thinkingConfig: { thinkingBudget: 2048 } } : {};

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: eventSchema,
        temperature: 0.4,
        ...thinkingConfig
      }
    });

    let text = response.text || "{}";
    // Robustly strip markdown code blocks if the model includes them despite configuration
    text = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    
    const data = JSON.parse(text);
    return data.events?.map((e: any) => ({ ...e, date: dateStr })) || [];
  } catch (error: any) {
    console.error("Gemini Schedule Error:", error);
    // Throw error so UI can display it
    if (error.message.includes("API Key")) throw error;
    if (error.status === 403 || error.message.includes("403")) throw new Error("Invalid API Key or permission denied.");
    if (error.status === 429 || error.message.includes("429")) throw new Error("API Quota exceeded. Please try again later.");
    throw new Error(`Failed to fetch schedule: ${error.message || "Unknown error"}`);
  }
};

export const fetchDailyRecap = async (dateStr: string, prefs: UserPreferences): Promise<DailyRecapData | null> => {
  try {
    const ai = getAIClient(prefs.apiKey);
    const modelName = prefs.geminiModel || "gemini-3-pro-preview";
    
    // Use custom prompt or default
    let prompt = prefs.recapPrompt || DEFAULT_RECAP_PROMPT;

    // Perform replacements
    prompt = prompt.replace('{{DATE}}', dateStr)
                   .replace('{{SPORTS}}', prefs.selectedSports.join(", "))
                   .replace('{{LEAGUES}}', prefs.followedLeagues.join(", ") || "None specified")
                   .replace('{{TEAMS}}', prefs.favoriteTeams.join(", ") || "None specified");

    // Explicitly append schema structure
    const jsonStructure = JSON.stringify(recapSchema, null, 2);
    prompt += `\n\nCRITICAL OUTPUT INSTRUCTION:\nYour response MUST be a valid JSON object adhering strictly to the following Schema:\n${jsonStructure}`;

    const isThinkingModel = modelName.includes("pro") || modelName.includes("thinking");
    const thinkingConfig = isThinkingModel ? { thinkingConfig: { thinkingBudget: 2048 } } : {};

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recapSchema,
        temperature: 0.5,
        ...thinkingConfig
      }
    });

    let text = response.text || "{}";
    text = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

    const data = JSON.parse(text);
    return {
      date: dateStr,
      summary: data.summary || "No summary available.",
      results: data.results || [],
      standings: data.standings || [],
    };
  } catch (error: any) {
    console.error("Gemini Recap Error:", error);
    if (error.message.includes("API Key")) throw error;
    throw new Error(`Failed to fetch recap: ${error.message || "Unknown error"}`);
  }
};