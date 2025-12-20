
import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, ModificationRequest } from "../types";
import { db } from "./auth";

/**
 * DOCUSYNTH CORE: STABLE_GEMINI_SYNTHESIS
 * Enforced use of gemini-2.5-flash-image production endpoint.
 */

const getClient = async () => {
  // Use strictly production key from settings
  const operationalKey = await db.getSettings('gemini_api_key');
  const apiKey = operationalKey || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: No valid Operational License Key found.");
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

export const testAiConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const ai = await getClient();
    // 1x1 Transparent PNG Pixel
    const tinyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: tinyImage, mimeType: 'image/png' } },
          { text: "Respond with the word 'READY' if you can see this image." }
        ]
      }
    });

    if (response.candidates?.[0]) {
      return { success: true, message: "Engine connection verified. Neural link active." };
    }
    return { success: false, message: "Engine responded but returned no candidates." };
  } catch (err: any) {
    return { success: false, message: err.message || "Connection refused by neural endpoint." };
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
    const ai = await getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Strict production-only model
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

    // Access .text property directly as per guidelines
    const textTrace = response.text || "No metadata returned.";
    return { 
      thinking: `SYNTH_REJECTED: Model returned text. Trace: ${textTrace}` 
    };
    
  } catch (err: any) {
    console.error("Gemini Synthesis Failure:", err);
    const isQuota = err.message?.includes('429') || err.message?.includes('quota');
    return { 
      thinking: `CORE_LINK_ERROR: ${err.message || "Synthesis failure."}`,
      quotaError: isQuota
    };
  }
};
