import { GoogleGenAI } from "@google/genai";
import { ModOption } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generatePatchScript = async (fileName: string, activeMods: ModOption[]): Promise<string> => {
  if (!apiKey) {
    return "00000000: API KEY MISSING -> ABORT PROCESS\n// Please check environment configuration.";
  }

  const modList = activeMods.map(m => m.name).join(', ');
  const prompt = `
    You are a low-level binary analysis AI.
    Target File: "${fileName}"
    Active Injections: ${modList}
    
    Task: Generate a realistic "Hex Dump Diff" simulating a patch.
    If the mod is "Unlimited Currency", explicitly show lines modifying the detected currencies (e.g. Gold, Gems) based on the filename.
    
    Output Format:
    0x0045A1: 1A 4F -> 00 00 (NOP) // Description
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || '// No patch data generated';
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `// Error generating patch: ${(error as Error).message}`;
  }
};

export const analyzeFile = async (fileName: string): Promise<string> => {
    if (!apiKey) return "API Key missing.";
    
    const prompt = `Analyze the filename "${fileName}". Return a single sentence technical description of the likely file structure and engine (e.g. Unity, Unreal, Godot).`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || 'Analysis failed.';
    } catch (error) {
        return "Analysis unavailable.";
    }
}

export const identifyCurrencies = async (fileName: string): Promise<string[]> => {
    if (!apiKey) return ['Gold', 'Coins'];

    // Specialized prompt to detect currencies based on game name
    const prompt = `
        Based on the filename "${fileName}", what are the likely premium currencies in this game?
        Return ONLY a comma-separated list of 1-3 items (e.g., "Gems, Gold"). 
        If it's a generic file or unknown, return "Credits, Money".
        Do not write full sentences.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        const text = response.text || '';
        return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } catch (error) {
        return ['Money', 'Points'];
    }
}