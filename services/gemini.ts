
import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, ModificationRequest } from "../types";
import { db } from "./auth";

/**
 * DOCUSYNTH CORE: NEURAL SYNTHESIS ENGINE
 * Strictly follows @google/genai SDK initialization guidelines.
 */

const getModelName = async (): Promise<string> => {
  const savedModel = await db.getSettings('active_model');
  return savedModel || 'gemini-2.5-flash-image';
};

const cleanBase64 = (dataUrl: string): { data: string; mimeType: string } => {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { data: dataUrl, mimeType: 'image/png' };
  }
  return { mimeType: matches[1], data: matches[2] };
};

export const testAiConnection = async (): Promise<{ success: boolean; message: string; code?: number }> => {
  try {
    // CRITICAL: New instance right before call ensures up-to-date key from dialog
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = await getModelName();
    const tinyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: tinyImage, mimeType: 'image/png' } },
          { text: "Respond 'OK'." }
        ]
      }
    });

    if (response.candidates?.[0]) {
      return { success: true, message: `Neural link active on ${model}.` };
    }
    return { success: false, message: "Engine silent. No candidates returned." };
  } catch (err: any) {
    const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      return { 
        success: false, 
        message: "QUOTA_EXCEEDED: 0 limit detected. Use 'CONNECT PERSONAL KEY' button.",
        code: 429 
      };
    }
    return { success: false, message: err.message || "Connection refused by host." };
  }
};

export const processDocument = async (
  baseImageBase64: string | null,
  request: ModificationRequest,
  options: ProcessingOptions
): Promise<{ imageUrl?: string; thinking?: string; quotaError?: boolean }> => {
  
  if (!baseImageBase64) return { thinking: "SOURCE_EMPTY." };

  const { data, mimeType } = cleanBase64(baseImageBase64);
  const model = await getModelName();

  const mappingDirectives = request.textReplacements
    .filter(r => r.key && r.value)
    .map(r => `SUBSTITUTE: Locate text "${r.key}" and replace with exactly "${r.value}".`)
    .join('\n');

  const finalPrompt = `
[SYSTEM MANDATE: FORENSIC-ACCURATE RASTER SYNTHESIS]

REPLACEMENTS:
${mappingDirectives}

USER INSTRUCTIONS:
${request.instructions}

FINAL DIRECTIVE: Analyze the attached image and generate a new version incorporating the requested text replacements and instructions. Maintain all forensic characteristics. Output ONLY the image data.
  `.trim();

  try {
    // CRITICAL: Fresh instance with injected key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: data, mimeType: mimeType } },
          { text: finalPrompt }
        ],
      },
      config: {
        temperature: 1.0, // High entropy for realistic texture synthesis
        topP: 0.95,
        topK: 64,
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      return { thinking: "SYNTH_FAILURE: Neural stream empty." };
    }

    let generatedImageUrl: string | undefined;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (generatedImageUrl) return { imageUrl: generatedImageUrl };

    return { thinking: `SYNTH_REJECTED: Model returned text. Trace: ${response.text || "Empty"}` };
    
  } catch (err: any) {
    const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
    return { 
      thinking: isQuota ? "QUOTA_EXCEEDED: Your project has zero limit. Use 'CONNECT PERSONAL KEY'." : `ERR: ${err.message}`,
      quotaError: isQuota
    };
  }
};
