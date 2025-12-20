
import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, ModificationRequest } from "../types";
import { db } from "./auth";

/**
 * DOCUSYNTH CORE: MULTI-MODEL SYNTHESIS ENGINE
 * Supports 'gemini-2.5-flash-image' and 'gemini-3-pro-image-preview'.
 */

const getModelName = async (): Promise<string> => {
  const savedModel = await db.getSettings('active_model');
  return savedModel || 'gemini-2.5-flash-image';
};

const getClient = () => {
  // Creating instance right before making an API call to ensure it uses 
  // the up-to-date API key from the aistudio dialog if one was selected.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: No operational key found in environment.");
  }
  return new GoogleGenAI({ apiKey });
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
    const ai = getClient();
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
      return { success: true, message: `Link established with ${model}. Neural link active.` };
    }
    return { success: false, message: "Engine responded but returned no candidates." };
  } catch (err: any) {
    const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      return { 
        success: false, 
        message: "QUOTA_EXCEEDED: This project has 0 limit. Open 'PERSONAL KEY' in Admin Panel to use your own key.",
        code: 429 
      };
    }
    return { success: false, message: err.message || "Connection refused." };
  }
};

export const processDocument = async (
  baseImageBase64: string | null,
  request: ModificationRequest,
  options: ProcessingOptions
): Promise<{ imageUrl?: string; thinking?: string; quotaError?: boolean }> => {
  
  if (!baseImageBase64) {
    return { thinking: "SOURCE_EMPTY: Provide document image." };
  }

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
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: data,
              mimeType: mimeType,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      return { thinking: "SYNTH_FAILURE: Neural stream empty." };
    }

    const candidate = response.candidates[0];
    let generatedImageUrl: string | undefined;

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (generatedImageUrl) {
      return { imageUrl: generatedImageUrl };
    }

    const textTrace = response.text || "No metadata returned.";
    return { 
      thinking: `SYNTH_REJECTED: Model returned text. Trace: ${textTrace}` 
    };
    
  } catch (err: any) {
    const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
    console.error("Gemini Synthesis Failure:", err);
    return { 
      thinking: isQuota 
        ? "QUOTA_EXCEEDED: Your current project has zero limit for this model. Use the 'CONNECT PERSONAL KEY' button in Admin Panel."
        : `CORE_LINK_ERROR: ${err.message || "Synthesis failure."}`,
      quotaError: isQuota
    };
  }
};
