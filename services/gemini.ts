
import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, ModificationRequest } from "../types";

/**
 * DOCUSYNTH CORE: GEMINI_FLASH_IMAGE_SYNTHESIS_V1
 * Using gemini-2.5-flash-image for forensic-grade document synthesis.
 */
export const processDocument = async (
  baseImageBase64: string | null,
  request: ModificationRequest,
  options: ProcessingOptions
): Promise<{ imageUrl?: string; thinking?: string; quotaError?: boolean }> => {
  
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    // We return a specific message that triggers the key selection flow in the UI.
    return { 
      thinking: "CORE_LINK_ERROR: No operational API key detected in process.env. Please ensure API_KEY is set in Vercel or use 'Manage API Link' to select a key manually.",
      quotaError: true 
    };
  }

  // Create fresh instance right before making an API call to ensure it uses the current key.
  // Using process.env.API_KEY directly as per SDK requirements.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const mappingDirectives = request.textReplacements
    .filter(r => r.key && r.value)
    .map(r => `SUBSTITUTE: Locate text "${r.key}" and replace with identical font "${r.value}".`)
    .join('\n');

  const finalPrompt = `
[SYSTEM MANDATE: SURGICAL RASTER SYNTHESIS]

OBJECTIVE: Perform forensic-grade bitmap reconstruction while maintaining 100% parity of non-target regions.

PHASE 1: ABSOLUTE BASE PRESERVATION
- RETAIN: 1:1 pixel parity, source aspect ratio, and native sensor noise profile.
- GEOMETRIC FIDELITY: Maintain document curvature, perspective distortions, and substrate warping.
- SECURITY ARCHITECTURE: Preserve holographic guilloche patterns, spectral micro-printing, and UV-reactive ink signatures.

PHASE 2: NEURAL INK INTEGRATION
${mappingDirectives}

PHASE 3: USER EDITING DIRECTIVES
${request.instructions}

PHASE 4: FORENSIC STEALTH EXECUTION
- RENDER: Output a unified raster image with realistic camera grain.
- FINAL STATE: Output must appear as a singular, authentic capture.

OUTPUT: Generate and return only the synthesized image. Do not include text explanation.
  `.trim();

  try {
    const parts: any[] = [{ text: finalPrompt }];
    
    if (baseImageBase64) {
      const split = baseImageBase64.split(',');
      const mimeType = split[0].match(/:(.*?);/)?.[1] || 'image/png';
      const data = split[1];
      
      parts.push({
        inlineData: {
          data,
          mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: request.thinkingMode ? 24576 : 0 }
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return { 
            imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` 
          };
        }
      }
    }

    return { 
      thinking: "SYNTH_REJECTED: The neural engine produced no bitmap response. This often happens if the instructions are too complex or violate safety filters."
    };
    
  } catch (err: any) {
    console.error("Gemini Engine Exception:", err);
    
    const msg = err.message || "";
    // Check for quota/billing errors or missing project errors.
    const isQuotaError = msg.includes('429') || 
                        msg.includes('quota') || 
                        msg.includes('limit: 0') ||
                        msg.includes('Requested entity was not found');

    if (isQuotaError) {
      return { 
        thinking: "RESOURCE_EXHAUSTED: Project limit reached or project not found. Use 'Manage API Link' to connect a paid GCP project with billing enabled.",
        quotaError: true
      };
    }

    return { 
      thinking: `CORE_LINK_ERROR: ${msg || "An unexpected error occurred during neural synthesis."}`
    };
  }
};
