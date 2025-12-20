
import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, ModificationRequest } from "../types";
import { db } from "./auth";

/**
 * DOCUSYNTH CORE: UNIFIED NEURAL SYNTHESIS
 * Optimized for Gemini 2.5 Flash (Nano Banana) with Global Admin Key.
 */

const getOperationalKey = async (): Promise<string> => {
  const savedKey = await db.getSettings('gemini_api_key');
  return savedKey || process.env.API_KEY || '';
};

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
    const apiKey = await getOperationalKey();
    if (!apiKey) throw new Error("OPERATIONAL_KEY_MISSING");

    const ai = new GoogleGenAI({ apiKey });
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
      return { success: true, message: `Global Link Active: ${model}` };
    }
    return { success: false, message: "Engine response incomplete." };
  } catch (err: any) {
    const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
    return { 
      success: false, 
      message: isQuota ? "QUOTA_EXHAUSTED: Admin key has hit its limit." : err.message,
      code: isQuota ? 429 : 500
    };
  }
};

export const processDocument = async (
  baseImageBase64: string | null,
  request: ModificationRequest,
  options: ProcessingOptions
): Promise<{ imageUrl?: string; thinking?: string; quotaError?: boolean }> => {
  
  if (!baseImageBase64) return { thinking: "SOURCE_MISSING" };

  const apiKey = await getOperationalKey();
  if (!apiKey) return { thinking: "OPERATIONAL_KEY_NOT_CONFIGURED" };

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
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: data, mimeType: mimeType } },
          { text: finalPrompt }
        ],
      },
      config: {
        temperature: 0.9,
        topP: 0.95,
        topK: 64,
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      return { thinking: "NEURAL_STREAM_EMPTY" };
    }

    let generatedImageUrl: string | undefined;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (generatedImageUrl) return { imageUrl: generatedImageUrl };
    return { thinking: `SYNTH_ERROR: Model returned text. Trace: ${response.text || "None"}` };
    
  } catch (err: any) {
    const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
    return { 
      thinking: isQuota ? "QUOTA_EXHAUSTED" : `CORE_ERR: ${err.message}`,
      quotaError: isQuota
    };
  }
};
