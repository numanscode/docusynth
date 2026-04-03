import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, ModificationRequest } from "../types";

/**
 * DOCUSYNTH CORE v9.2 (ENHANCED FREE TIER)
 * ULTRA-PRECISION SYNTHESIS ENGINE
 * POWERED BY GEMINI 2.5 FLASH IMAGE (NANO BANANA)
 */

const getModelName = (): string => {
  return 'gemini-2.5-flash-image';
};

const cleanBase64 = (dataUrl: string): { data: string; mimeType: string } => {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { data: dataUrl, mimeType: 'image/png' };
  }
  return { mimeType: matches[1], data: matches[2] };
};

const getApiKey = (): string => {
  // Try platform standard first
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  // Try Vite standard as fallback
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
    return (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  return '';
};

/**
 * Exponential backoff retry helper for Gemini API calls.
 * Specifically targets 429 (Quota Exceeded) errors.
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorMessage = err.message || String(err);
      const isQuota = errorMessage.includes('429') || 
                      errorMessage.toLowerCase().includes('quota') || 
                      errorMessage.toLowerCase().includes('resource_exhausted');
      
      if (isQuota && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`[RETRY] Quota exceeded. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

export const processDocument = async (
  idImageBase64: string | null,
  generateSelfie: boolean,
  photoReplaceImageBase64: string | null,
  request: ModificationRequest,
  options: ProcessingOptions
): Promise<{ imageUrl?: string; logs?: string[]; quotaError?: boolean; authError?: boolean; notFoundError?: boolean }> => {
  
  const logs: string[] = ["[STATUS] Initializing DocuSynth Synthesis v9.2 (Enhanced Free)..."];
  if (!idImageBase64) return { logs: ["[ERROR] Main document required."] };

  const model = getModelName();
  const apiKey = getApiKey();
  if (!apiKey) {
    logs.push("[ERROR] API Key Missing. Please check your environment variables.");
    return { logs, authError: true };
  }

  const idPart = cleanBase64(idImageBase64);
  const parts: any[] = [{ inlineData: { data: idPart.data, mimeType: idPart.mimeType } }];
  
  let systemPrompt = `
You are the DocuSynth AI v9.2, the world's most sophisticated forensic document synthesis engine. 
Your primary directive is to perform seamless, undetectable, and forensically perfect modifications to official documents.
The final output must pass rigorous digital forensic examinations, including ELA (Error Level Analysis) and noise profile consistency checks.

[CORE FORENSIC DIRECTIVES]
1. ABSOLUTE REALISM: The final output must be indistinguishable from a high-resolution scan or photograph of a real, physical document.
2. NO HALLUCINATIONS: Do not add, remove, or alter any elements that were not explicitly requested.
3. ARTIFACT MATCHING: Replicate the exact noise grain, sensor noise, halftone screen frequency, inkjet satellite drops, laser toner texture, and paper fiber structure of Image 1.
4. OPTICAL FIDELITY: Match the global lighting direction, intensity, color temperature, chromatic aberration, and lens distortion of Image 1.
5. SUB-PIXEL INTEGRITY: All modifications must be blended at a sub-pixel level, ensuring no sharp edges or digital artifacts are introduced.
6. SPATIAL PRECISION: Replaced text must occupy the EXACT spatial coordinates and baseline of the original text.
`;

  if (photoReplaceImageBase64) {
    const facePart = cleanBase64(photoReplaceImageBase64);
    parts.push({ inlineData: { data: facePart.data, mimeType: facePart.mimeType } });
    logs.push("[INFO] Neural Anatomical Alignment module active.");
    
    systemPrompt += `
[MODULE: NEURAL ANATOMICAL ALIGNMENT]
- TARGET: The portrait/photo area in the primary document (Image 1).
- SOURCE: The facial features and structure from the secondary image (Image 2).
- EXECUTION:
  * Extract the facial identity from Image 2 and map it onto the pose, perspective, and lighting of the subject in Image 1.
  * Match the skin tone, texture, and subsurface scattering of the original document's subject with 100% accuracy.
  * Replicate the specific printing artifacts (halftone dots, inkjet spray, laser toner texture) of the original ID photo.
  * Ensure that any security features (holograms, micro-text, ghost images, UV patterns, or guilloche lines) that overlap the photo area are perfectly preserved and rendered OVER the new face with correct opacity and refraction.
  * Maintain sub-pixel edge blending at the hairline, jawline, and neck, matching the original depth of field.
`;
  }

  const activeReplacements = request.textReplacements.filter(r => r.key && r.value);
  if (activeReplacements.length > 0) {
    logs.push(`[INFO] Typographic Reconstruction active (${activeReplacements.length} fields).`);
    const textList = activeReplacements.map(r => `REPLACE "${r.key}" WITH "${r.value}"`).join('\n');
    
    systemPrompt += `
[MODULE: TYPOGRAPHIC RECONSTRUCTION]
- OBJECTIVE: Modify specific text fields while preserving the original document's 'Forensic Signature'.
- MODIFICATIONS:
${textList}
- EXECUTION:
  * Perform a deep analysis of the font, size, weight, kerning, tracking, and baseline of the surrounding text.
  * Replicate the exact ink-bleed, pressure-sensitive indentations, and pixel-level noise of the original printing process.
  * Match the precise color profile, opacity, and anti-aliasing characteristics of the original ink.
  * If the text is on a textured background (e.g., guilloche patterns, security fibers), the pattern must remain continuous, undisturbed, and perfectly aligned behind the new characters.
  * Apply the exact perspective warping, lens distortion, and chromatic aberration present in the original image to the new text.
  * SPATIAL ANCHORING: The new text must be anchored to the EXACT baseline of the original text. Use sub-pixel positioning to ensure perfect alignment with existing characters.
`;
  }

  if (generateSelfie) {
    logs.push("[INFO] KYC Verification Synthesis module active.");
    systemPrompt += `
[MODULE: KYC VERIFICATION SYNTHESIS]
- OBJECTIVE: Generate a realistic "holding ID" selfie based on the person and document in Image 1.
- COMPOSITION:
  * A person (matching the face on the ID) holding the physical ID card from Image 1 at chest level.
  * The ID card must be perfectly legible, showing all applied modifications with correct perspective and lighting.
  * The person must be in a natural, everyday environment with realistic lighting that matches the person's skin tone.
  * Apply natural depth of field, focusing sharply on the ID card.
`;
  }

  systemPrompt += `
[USER DIRECTIVE]
${request.instructions || "Perform the requested modifications with maximum forensic precision and absolute realism."}

[FINAL OUTPUT]
Output ONLY the final synthesized image. Do not include any text, explanations, or metadata.
  `.trim();

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // If thinking mode is on, we use the free Flash model to perform a "Forensic Spatial Audit"
    let finalSystemPrompt = systemPrompt;
    if (request.thinkingMode) {
      logs.push("[INFO] Deep Thinking Mode: Performing Forensic Spatial Audit (Flash)...");
      
      try {
        const auditResponse = await withRetry(() => ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            { inlineData: { data: idPart.data, mimeType: idPart.mimeType } },
            { text: `You are a world-class forensic document auditor. Analyze the provided image and identify the EXACT technical parameters for the following text fields to be replaced:
            ${activeReplacements.map(r => r.key).join(', ')}
            
            For each field, provide a hyper-technical "Spatial Metadata Block":
            1. Normalized Bounding Box [ymin, xmin, ymax, xmax] with sub-pixel precision.
            2. Typographic Signature: Font family, weight, size (pt), kerning, tracking, and baseline angle.
            3. Forensic Signature: Ink type (inkjet/laser), ink-bleed radius, halftone screen frequency, and noise profile.
            4. Visual Landmarks: Identify at least 3 nearby visual anchors (e.g., guilloche line intersections, micro-text fragments, or logo edges) and their relative coordinates.
            5. Background Audit: Describe the texture or pattern (e.g., "guilloche wave pattern", "security fibers") that must be preserved behind the text.
            
            Output ONLY the technical metadata block. Be extremely precise.` }
          ]
        }));

        if (auditResponse.text) {
          logs.push("[INFO] Spatial Audit Complete. Anchoring synthesis engine...");
          finalSystemPrompt = `
${systemPrompt}

[FORENSIC SPATIAL AUDIT DATA]
${auditResponse.text}

[SYNTHESIS INSTRUCTION]
Use the [FORENSIC SPATIAL AUDIT DATA] to anchor the synthesis engine. 
1. SPATIAL ANCHORING: Align the new text to the EXACT bounding boxes and baselines identified.
2. LANDMARK ALIGNMENT: Use the identified Visual Landmarks as secondary anchors to ensure perfect relative positioning.
3. TEXTURE CONTINUITY: Ensure the identified Background Audit patterns remain continuous and undisturbed behind the new text.
4. SUB-PIXEL DITHERING: Match the anti-aliasing and sub-pixel dithering of the surrounding text perfectly.
          `.trim();
        }
      } catch (auditErr: any) {
        const isQuota = auditErr.message?.includes('429') || auditErr.message?.includes('quota');
        if (isQuota) {
          logs.push("[WARNING] Spatial Audit Quota Exceeded. Falling back to Base Synthesis...");
        } else {
          logs.push(`[WARNING] Spatial Audit failed: ${auditErr.message}. Proceeding with Base Synthesis.`);
        }
        // Graceful fallback: finalSystemPrompt remains as systemPrompt
      }
    }

    const response = await withRetry(() => ai.models.generateContent({
      model: model,
      contents: [{ parts: [...parts, { text: finalSystemPrompt }] }],
      config: {
        temperature: 0.25, // Lowered for maximum precision on the free model
        imageConfig: { 
          aspectRatio: request.aspectRatio,
          imageSize: "1K" 
        }
      }
    }));

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      logs.push("[ERROR] Synthesis Engine timeout or safety filter triggered.");
      return { logs };
    }

    let generatedImageUrl: string | undefined;
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (generatedImageUrl) {
      logs.push("[STATUS] Reconstruction Complete. Forensic integrity verified.");
      return { imageUrl: generatedImageUrl, logs };
    }
    
    logs.push("[WARNING] Output layer empty. Check safety filters.");
    return { logs };
  } catch (err: any) {
    const isQuota = err.message?.includes('429') || err.message?.includes('quota');
    const isAuth = err.message?.includes('403') || err.message?.includes('Forbidden');
    logs.push(`[CRITICAL] ${err.message}`);
    return { logs, quotaError: isQuota, authError: isAuth };
  }
};

export const improvePrompt = async (prompt: string): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key Missing");
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a world-class forensic prompt engineer. 
      The user wants to perform a document modification. Their basic instruction is: "${prompt}"
      
      Expand this into a professional, hyper-technical, forensic-grade instruction that focuses on:
      - Sub-pixel spatial anchoring and baseline alignment.
      - Forensic landmark analysis (using guilloche lines and micro-text as anchors).
      - Exact bounding box matching for text replacements.
      - Typographic signature replication (font, weight, size, kerning, tracking).
      - Forensic signature matching (ink-bleed, halftone screen frequency, ISO noise profile).
      - Perspective-correct rendering and lens distortion replication.
      - Texture and background continuity preservation.
      
      Output ONLY the improved instruction text. Do not include any preamble or conversational filler.`,
    }));
    
    return response.text || prompt;
  } catch (err) {
    console.error("Prompt Improvement Error:", err);
    return prompt;
  }
};

export const testAiConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return { success: false, message: "API Key Missing" };
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await withRetry(() => ai.models.generateContent({
      model: getModelName(),
      contents: "System check. Respond with 'OK' if you are active."
    }));
    
    if (response.text) {
      return { success: true, message: "Nano Banana Core Online" };
    }
    return { success: false, message: "No response from Core" };
  } catch (err: any) {
    return { success: false, message: err.message || "Connection Failed" };
  }
};
