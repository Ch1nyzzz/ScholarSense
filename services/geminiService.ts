import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PaperAnalysis } from "../types";

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The official title of the paper." },
    authors: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of authors."
    },
    summary_background: { type: Type.STRING, description: "Background and context of the research." },
    motivation: { type: Type.STRING, description: "Why was this research done? What gap does it fill?" },
    core_method_math_latex: { type: Type.STRING, description: "The core methodology, including key mathematical formulas in LaTeX format." },
    experiments_setup: { type: Type.STRING, description: "How were the experiments conducted?" },
    results_metrics: { type: Type.STRING, description: "Key results and metrics achieved." },
    reviewer_critique: { type: Type.STRING, description: "Critical analysis of potential weaknesses or limitations." },
    one_more_thing: { type: Type.STRING, description: "One unique, surprising, or particularly interesting insight from the paper." },
  },
  required: ["title", "authors", "summary_background", "motivation", "core_method_math_latex", "experiments_setup", "results_metrics", "reviewer_critique", "one_more_thing"],
};

export const analyzePaperWithGemini = async (text: string, apiKey: string): Promise<PaperAnalysis> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Truncate text if excessively long to fit context window safely (though Flash has large window)
  // Approx 1 char = 1 byte. Flash 2.0 has 1M tokens. We are safe, but let's be prudent.
  const MAX_CHARS = 500000; 
  const processedText = text.length > MAX_CHARS ? text.substring(0, MAX_CHARS) + "...(truncated)" : text;

  const prompt = `
    Analyze the following academic paper text. 
    Act as a top-tier researcher and UI designer. 
    Extract the key information strictly according to the requested JSON structure.
    
    For the 'core_method_math_latex' field, ensure you extract the most important equations and format them using standard LaTeX syntax (e.g., $E=mc^2$ for inline or $$...$$ for block).
    Do not include markdown code fencing (like \`\`\`json) in the response, just the raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            { text: prompt },
            { text: processedText }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });

    const resultText = response.text();
    
    if (!resultText) {
        throw new Error("Empty response from Gemini");
    }

    // Parse JSON
    const data = JSON.parse(resultText) as PaperAnalysis;
    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};