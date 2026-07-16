import { Request, Response } from "express";
import { geminiService } from "../services/gemini";

export class GeminiController {
  /**
   * Health Check proxy endpoint
   */
  public getHealth(req: Request, res: Response) {
    return res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || "development",
      hasApiKey: !!process.env.GEMINI_API_KEY,
    });
  }

  /**
   * Secure proxy for generating text/code with Gemini models
   */
  public async generateText(req: Request, res: Response) {
    try {
      const { prompt, systemInstruction, model, temperature } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Missing 'prompt' parameter in request body." });
      }

      const result = await geminiService.generateContent(
        prompt,
        systemInstruction,
        model,
        temperature
      );

      return res.json(result);
    } catch (error: any) {
      console.error("[GeminiController] Generate API Error:", error);
      return res.status(500).json({
        error: error.message || "An error occurred while generating content from Gemini.",
        details: error.stack,
      });
    }
  }

  /**
   * Secure proxy for generating text embeddings
   */
  public async generateEmbeddings(req: Request, res: Response) {
    try {
      const { text, model } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Missing 'text' parameter in request body." });
      }

      const result = await geminiService.embedContent(text, model);

      return res.json(result);
    } catch (error: any) {
      console.error("[GeminiController] Embed API Error:", error);
      return res.status(500).json({
        error: error.message || "An error occurred while generating embeddings.",
        details: error.stack,
      });
    }
  }
}

export const geminiController = new GeminiController();
