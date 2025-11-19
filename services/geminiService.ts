

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PaperAnalysis, Language, AiConfig, AiProvider } from "../types";

// Common schema for all providers
const analysisJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "The official title of the paper." },
    authors: { 
      type: "array", 
      items: { type: "string" },
      description: "List of authors."
    },
    background: { type: "string", description: "Background of the field, context for non-experts." },
    motivation: { type: "string", description: "Research motivation, problem definition, significance." },
    research_conclusion: { type: "string", description: "Core research conclusion, how it answers the motivation." },
    methodology_math: { type: "string", description: "Mathematical modeling, symbols, formulas (LaTeX), and algorithm flow. Use double-escaped backslashes for LaTeX." },
    implementation_details: { type: "string", description: "Detailed experimental setup, datasets, hyperparams, prompts (reproducible details)." },
    evaluation_results: { type: "string", description: "Baseline comparisons, specific metrics, and insights." },
    reviewer_critique: { type: "string", description: "Critical review: pros, cons, and future improvements." },
    one_more_thing: { type: "string", description: "A unique, surprising, or valuable additional insight." },
    suggested_tags: { 
        type: "array", 
        items: { type: "string" }, 
        description: "List of 3-5 short, relevant semantic tags (e.g., 'LLM', 'Vision', 'RL')." 
    }
  },
  required: [
    "title", "authors", "background", "motivation", "research_conclusion", 
    "methodology_math", "implementation_details", "evaluation_results", 
    "reviewer_critique", "one_more_thing", "suggested_tags"
  ],
};

// Gemini Specific Schema Type
const geminiSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        authors: { type: Type.ARRAY, items: { type: Type.STRING } },
        background: { type: Type.STRING },
        motivation: { type: Type.STRING },
        research_conclusion: { type: Type.STRING },
        methodology_math: { type: Type.STRING },
        implementation_details: { type: Type.STRING },
        evaluation_results: { type: Type.STRING },
        reviewer_critique: { type: Type.STRING },
        one_more_thing: { type: Type.STRING },
        suggested_tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["title", "authors", "background", "motivation", "research_conclusion", "methodology_math", "implementation_details", "evaluation_results", "reviewer_critique", "one_more_thing", "suggested_tags"]
};

const getSystemPrompt = (language: Language) => {
    const languageInstruction = language === 'zh' 
      ? "Use CHINESE (Simplified) for the analysis content (except for specific technical terms, formulas, or proper nouns). However, keep tags in English if they are standard technical terms."
      : "Use ENGLISH for the analysis content.";

    return `
      You are a top-tier AI researcher, full-stack developer, and information designer specializing in academic interpretation.
      
      Your task is to analyze the provided academic paper text and return a structured JSON object.
      
      ${languageInstruction}
  
      The analysis must be extremely detailed, aiming to provide 90% of the paper's core information to allow for reproducibility.
      
      Fill the JSON fields based on these specific requirements:
      
      1. **background**: What field is this? What is the background? Explain simply so a non-expert understands.
      2. **motivation**: What problem was found? Why solve it? What is the significance and purpose?
      3. **research_conclusion**: What was concluded? What method was designed? How does it relate to the motivation and solve the problem?
      4. **methodology_math**: From symbols/representation to formulas (LaTeX) and algorithm flow. How does it differ from prior algorithms? 
         **CRITICAL LATEX INSTRUCTIONS:**
         - Use '$' for inline math and '$$' for block math.
         - DO NOT use '\\(' or '\\['.
         - You are outputting a JSON string. You MUST double-escape all LaTeX backslashes. 
         - Example: To output "\\alpha", you must write "\\\\alpha" in the JSON.
         - Example: To output "\\frac{a}{b}", you must write "\\\\frac{a}{b}" in the JSON.
      5. **implementation_details**: Systematically organize details (models, data, hyperparameters, prompts, etc.). Reference the appendix if needed. Aim for reproducibility.
      6. **evaluation_results**: Compare baselines. What effect was achieved? What insights were revealed?
      7. **reviewer_critique**: Act as a sharp reviewer. Critique the work. Strengths, weaknesses, and improvement directions.
      8. **one_more_thing**: Free form. Something important/interesting you want to share.
      9. **suggested_tags**: Generate 3-5 precise tags for categorization.
  
      IMPORTANT: 
      - Return ONLY valid JSON matching the schema.
      - Ensure correct JSON escaping for all control characters and backslashes.
    `;
};

// --- Provider Implementations ---

async function callGemini(text: string, apiKey: string, model: string, language: Language): Promise<PaperAnalysis> {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                { text: getSystemPrompt(language) },
                { text: text }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: geminiSchema,
        }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from Gemini");
    return JSON.parse(resultText) as PaperAnalysis;
}

async function callOpenAICompatible(
    text: string, 
    apiKey: string, 
    model: string, 
    language: Language, 
    baseUrl: string
): Promise<PaperAnalysis> {
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    // DeepSeek and other "Thinking" models (like o1) often don't support json_object mode effectively or at all in beta.
    // We use a relaxed approach: Ask for JSON in text, then parse it.
    const useJsonMode = !model.includes('reasoner') && !model.includes('o1') && !model.includes('R1');

    const body: any = {
        model: model,
        messages: [
            { role: "system", content: getSystemPrompt(language) + "\n\nRespond STRICTLY with a valid JSON object." },
            { role: "user", content: text }
        ],
        temperature: 0.2
    };

    if (useJsonMode) {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`AI Provider Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty response from AI Provider");

    // Clean up Markdown code blocks if present (some models might wrap JSON in ```json ... ```)
    const cleanContent = content.replace(/```json\n?|```/g, '').trim();

    try {
        return JSON.parse(cleanContent) as PaperAnalysis;
    } catch (e) {
        console.error("JSON Parse Error on content:", cleanContent);
        throw new Error("Failed to parse AI response as JSON");
    }
}


// --- Main Exported Function ---

export const analyzePaperWithGemini = async (text: string, config: AiConfig, language: Language): Promise<PaperAnalysis> => {
    const { activeProvider, activeModel, keys, baseUrls } = config;
    const apiKey = keys[activeProvider];

    if (!apiKey) throw new Error(`${activeProvider.toUpperCase()} API Key is missing. Please check settings.`);

    // Truncate text if excessively long (Different models have different context windows)
    const LONG_CONTEXT_MODELS = ['gemini', 'siliconflow'];
    const MAX_CHARS = LONG_CONTEXT_MODELS.includes(activeProvider) 
        ? 500000  // ~125k tokens, safe for most long-context models
        : 100000; // ~25k tokens

    const processedText = text.length > MAX_CHARS ? text.substring(0, MAX_CHARS) + "...(truncated)" : text;

    switch (activeProvider) {
        case 'gemini':
            return callGemini(processedText, apiKey, activeModel, language);
        
        case 'siliconflow':
            return callOpenAICompatible(
                processedText, 
                apiKey, 
                activeModel, 
                language, 
                baseUrls.siliconflow || 'https://api.siliconflow.cn/v1'
            );

        case 'openai':
            return callOpenAICompatible(
                processedText, 
                apiKey, 
                activeModel, 
                language, 
                baseUrls.openai || 'https://api.openai.com/v1'
            );

        default:
            throw new Error(`Provider ${activeProvider} not implemented yet.`);
    }
};

// --- URL Analysis ---
// Note: URL Analysis currently heavily relies on Google Grounding (Gemini only).

export const analyzePaperFromUrl = async (url: string, config: AiConfig, language: Language): Promise<PaperAnalysis> => {
    const geminiKey = config.keys.gemini;
    
    if (!geminiKey) {
        throw new Error("URL Analysis currently requires a Gemini API Key because it uses Google Search Grounding. Please configure a Gemini Key.");
    }
  
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const languageInstruction = language === 'zh' 
      ? "The comprehensive summary should be in CHINESE (Simplified)."
      : "The comprehensive summary should be in ENGLISH.";

    let searchContext = `URL: ${url}`;
    const arxivMatch = url.match(/arxiv\.org\/pdf\/([\d\.]+)/) || url.match(/arxiv\.org\/abs\/([\d\.]+)/);
    if (arxivMatch) {
        const arxivId = arxivMatch[1];
        searchContext = `Arxiv Paper ID: ${arxivId}. Please Search for "arxiv ${arxivId}" to find the title, abstract, and authors from the arxiv.org abstract page.`;
    }
  
    const searchPrompt = `
      I need to analyze an academic paper.
      ${searchContext}
      
      Please perform a Google Search to find the full details of this paper.
      1. Find the Abstract, Title, and Authors.
      2. If possible, find the full text content or a detailed summary from the abstract page, code repositories, or academic discussions.
  
      Provide a **comprehensive, detailed summary** of the paper covering the following aspects strictly:
      1. Official Title
      2. Authors
      3. Background of the field
      4. Motivation and Problem Statement
      5. Research Conclusion
      6. Methodology (Math, Formulas, Algorithms) - Be detailed here.
      7. Implementation Details (Datasets, setup)
      8. Evaluation Results
      9. Reviewer Critique (Pros/Cons)
      10. "One More Thing" (Unique insight)
      11. Suggested Tags (3-5 tags)

      ${languageInstruction}
    `;
  
    try {
      // Step 1: Search
      const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: searchPrompt }] },
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
  
      const searchSummary = searchResponse.text;
      if (!searchSummary) {
          throw new Error("Could not retrieve information about this paper from the URL. The search returned no results.");
      }
  
      // Step 2: Format using the user's preferred model (or just Gemini to be safe/fast)
      const formattingPrompt = `
        You are a structured data converter. 
        
        Take the following research paper summary and convert it into a valid JSON object matching the schema provided.
        
        Summary:
        ${searchSummary}
        
        Requirements:
        - Ensure 'methodology_math' uses LaTeX format with double-escaped backslashes (e.g. \\\\alpha).
        - Ensure all fields from the schema are populated based on the summary.
      `;
  
      const analysisResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: formattingPrompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: geminiSchema,
        }
      });
  
      const resultText = analysisResponse.text;
      if (!resultText) throw new Error("Failed to format analysis into JSON.");
  
      return JSON.parse(resultText) as PaperAnalysis;
  
    } catch (error) {
      console.error("Gemini URL Analysis Error:", error);
      throw error;
    }
};