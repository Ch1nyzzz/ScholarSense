import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PaperAnalysis, Language } from "../types";

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The official title of the paper." },
    authors: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of authors."
    },
    background: { type: Type.STRING, description: "Background of the field, context for non-experts." },
    motivation: { type: Type.STRING, description: "Research motivation, problem definition, significance." },
    research_conclusion: { type: Type.STRING, description: "Core research conclusion, how it answers the motivation." },
    methodology_math: { type: Type.STRING, description: "Mathematical modeling, symbols, formulas (LaTeX), and algorithm flow." },
    implementation_details: { type: Type.STRING, description: "Detailed experimental setup, datasets, hyperparams, prompts (reproducible details)." },
    evaluation_results: { type: Type.STRING, description: "Baseline comparisons, specific metrics, and insights." },
    reviewer_critique: { type: Type.STRING, description: "Critical review: pros, cons, and future improvements." },
    one_more_thing: { type: Type.STRING, description: "A unique, surprising, or valuable additional insight." },
  },
  required: [
    "title", "authors", "background", "motivation", "research_conclusion", 
    "methodology_math", "implementation_details", "evaluation_results", 
    "reviewer_critique", "one_more_thing"
  ],
};

export const analyzePaperWithGemini = async (text: string, apiKey: string, language: Language): Promise<PaperAnalysis> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Truncate text if excessively long (Gemini 1.5 Flash has 1M window, but let's be safe at 500k chars)
  const MAX_CHARS = 500000; 
  const processedText = text.length > MAX_CHARS ? text.substring(0, MAX_CHARS) + "...(truncated)" : text;

  const languageInstruction = language === 'zh' 
    ? "Use CHINESE (Simplified) for the analysis content (except for specific technical terms, formulas, or proper nouns)."
    : "Use ENGLISH for the analysis content.";

  const prompt = `
    You are a top-tier AI researcher, full-stack developer, and information designer specializing in academic interpretation.
    
    Your task is to analyze the provided academic paper text and return a structured JSON object based on the requested schema.
    
    ${languageInstruction}

    The analysis must be extremely detailed, aiming to provide 90% of the paper's core information to allow for reproducibility.
    
    Fill the JSON fields based on these specific requirements:
    
    1. **background**: What field is this? What is the background? Explain simply so a non-expert understands.
    2. **motivation**: What problem was found? Why solve it? What is the significance and purpose?
    3. **research_conclusion**: What was concluded? What method was designed? How does it relate to the motivation and solve the problem?
    4. **methodology_math**: From symbols/representation to formulas (LaTeX) and algorithm flow. How does it differ from prior algorithms? **Ensure all math uses LaTeX format (e.g., $E=mc^2$). Do not break lines inside inline formulas.**
    5. **implementation_details**: Systematically organize details (models, data, hyperparameters, prompts, etc.). Reference the appendix if needed. Aim for reproducibility.
    6. **evaluation_results**: Compare baselines. What effect was achieved? What insights were revealed?
    7. **reviewer_critique**: Act as a sharp reviewer. Critique the work. Strengths, weaknesses, and improvement directions.
    8. **one_more_thing**: Free form. Something important/interesting you want to share.

    IMPORTANT: 
    - Return ONLY valid JSON matching the schema.
    - Ensure LaTeX backslashes are correctly escaped for JSON string usage (e.g., "\\alpha").
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

    const resultText = response.text;
    
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