
import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, ModificationRequest } from "../types";

/**
 * DOCUSYNTH CORE: GEMINI_FLASH_IMAGE_SYNTHESIS_V1
 * Direct integration with Google Gemini 2.5 Flash Image.
 * Using specific operational key for live deployment.
 */
export const processDocument = async (
  baseImageBase64: string | null,
  request: ModificationRequest,
  options: ProcessingOptions
): Promise<{ imageUrl?: string; thinking?: string }> => {
  // Use the provided operational key for live environments
  const operationalKey = process.env.API_KEY || "AIzaSyBx99gmPaN7SBFPjWyWqpYQ1z0o4Ffdzmw";
  
  const ai = new GoogleGenAI({ apiKey: operationalKey });
  
  const mappingDirectives = request.textReplacements
    .filter(r => r.key && r.value)
    .map(r => `SUBSTITUTE: Locate text "${r.key}" and replace with identical font "${r.value}".`)
    .join('\n');

  const finalPrompt = `
[SYSTEM MANDATE: SURGICAL RASTER SYNTHESIS]

OBJECTIVE: Perform forensic-grade bitmap reconstruction while maintaining 100% parity of non-target regions.

PHASE 1: ABSOLUTE BASE PRESERVATION
- RETAIN: 1:1 pixel parity, source aspect ratio, and native sensor noise profile.
- GEOMETRIC FIDELITY: Maintain document curvature and perspective distortions.

PHASE 2: NEURAL INK INTEGRATION
${mappingDirectives}

PHASE 3: USER EDITING DIRECTIVES
${request.instructions}

PHASE 4: FORENSIC STEALTH EXECUTION
- RENDER: Output a unified raster image with realistic camera grain.
- FINAL STATE: Output must appear as a singular, authentic capture.

OUTPUT: Generate and return only the synthesized image.
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
      contents: [{ role: 'user', parts }]
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
      thinking: "SYNTH_REJECTED: The model failed to generate a bitmap response."
    };
    
  } catch (err: any) {
    console.error("Gemini Engine Exception:", err);
    return { 
      thinking: `CORE_LINK_ERROR: ${err.message || "Link failure."}`
    };
  }
};
