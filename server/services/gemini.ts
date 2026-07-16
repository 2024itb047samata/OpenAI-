import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private aiClient: GoogleGenAI | null = null;

  public getClient(): GoogleGenAI {
    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set. Please add it in Settings > Secrets.");
      }
      this.aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return this.aiClient;
  }

  /**
   * Resets the client (useful when updating the API key in settings)
   */
  public resetClient(): void {
    this.aiClient = null;
  }

  /**
   * Generates content using Gemini
   */
  async generateContent(prompt: string, systemInstruction?: string, model?: string, temperature?: number) {
    const ai = this.getClient();
    const modelToUse = model || "gemini-3.5-flash";

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are an expert AI software engineer.",
        temperature: temperature !== undefined ? Number(temperature) : 0.2,
      },
    });

    return {
      text: response.text || "",
      model: modelToUse,
    };
  }

  /**
   * Generates embedding for text
   */
  async embedContent(text: string, model?: string) {
    const ai = this.getClient();
    const modelToUse = model || "text-embedding-004";

    const response: any = await ai.models.embedContent({
      model: modelToUse,
      contents: text,
    });

    const embeddingValues = response.embedding?.values || response.embeddings?.values || [];

    return {
      embedding: embeddingValues,
      model: modelToUse,
      dimensions: embeddingValues.length,
    };
  }
}

export const geminiService = new GeminiService();
