
import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, ModificationRequest } from "../types";
import { db } from "./auth";

/**
 * DOCUSYNTH CORE: NATIVE_GEMINI_SYNTHESIS
 * Direct integration with Gemini 2.5 Flash Image via the official SDK.
 */

const getClient = async () => {
  // Prioritize the key stored in Supabase/Settings
  const operationalKey = await db.getSettings('gemini_api_key');
  const apiKey = operationalKey || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: No valid Operational License Key found in the system. Check Admin Configuration.");
  }
  
  return new GoogleGenAI({ apiKey });
};

/**
 * Utility to extract clean base64 data from a Data URL.
 */
const cleanBase64 = (dataUrl: string): { data: string; mimeType: string } => {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { data: dataUrl, mimeType: 'image/png' };
  }
  return { mimeType: matches[1], data: matches[2] };
};

export const processDocument = async (
  baseImageBase64: string | null,
  request: ModificationRequest,
  options: ProcessingOptions
): Promise<{ imageUrl?: string; thinking?: string; quotaError?: boolean }> => {
  
  if (!baseImageBase64) {
    return { thinking: "SOURCE_EMPTY: No document image provided for synthesis." };
  }

  const { data, mimeType } = cleanBase64(baseImageBase64);

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

FINAL DIRECTIVE: Analyze the attached image and generate a new version incorporating the requested text replacements and instructions. Maintain all forensic characteristics. Output only the image.
  `.trim();

  try {
    const ai = await getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
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
      return { thinking: "SYNTH_FAILURE: The model failed to generate any candidates." };
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

    const textTrace = response.text || "No output generated.";
    return { 
      thinking: `SYNTH_REJECTED: The engine returned text instead of a synthesized image. Trace: ${textTrace}` 
    };
    
  } catch (err: any) {
    console.error("Gemini Synthesis Failure:", err);
    const isQuota = err.message?.includes('429') || err.message?.includes('quota');
    return { 
      thinking: `CORE_LINK_ERROR: ${err.message || "An unexpected error occurred during neural synthesis."}`,
      quotaError: isQuota
    };
  }
};
