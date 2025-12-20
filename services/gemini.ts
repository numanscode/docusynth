
import { ProcessingOptions, ModificationRequest } from "../types";

// Authorized operational keys for Kie.ai Node Access
const API_KEYS = [
  "b0e07432f1b29a57dc7b68d018138096",
  "75b0270880ebe8fd849dd933aa1f3e85"
];

const KIE_BASE_URL = "https://api.kie.ai/api/v1/jobs";

/**
 * Selects an operational key from the available pool via randomized distribution.
 */
const getOperationalKey = () => API_KEYS[Math.floor(Math.random() * API_KEYS.length)];

/**
 * DOCUSYNTH CORE: KIE_NANOBANANA_SYNTHESIS_V6.1
 * Optimized for multi-key rotation and high-fidelity output.
 */
const getSynthesisPrompt = (request: ModificationRequest) => {
  const mappingDirectives = request.textReplacements
    .filter(r => r.key && r.value)
    .map(r => `SUBSTITUTE: Locate text "${r.key}" and replace with identical-font "${r.value}".`)
    .join('\n');

  return `[SYSTEM MANDATE: SURGICAL RASTER SYNTHESIS]

OBJECTIVE: Re-render specific regions of the bitmap while maintaining 100% forensic parity.

PHASE 1: ABSOLUTE BASE PRESERVATION
- RETAIN: 1:1 pixel parity, source aspect ratio, and native sensor noise profile.
- GEOMETRIC FIDELITY: Maintain document curvature, perspective distortions, and substrate warping.

PHASE 2: NEURAL INK INTEGRATION
- DIRECTIVES:
${mappingDirectives}
- TYPOGRAPHY CLONING: Perform forensic-grade font synthesis. Match stroke-width dynamics and weight-to-pixel ratios.
- RASTER DYNAMICS: Replicate ink-on-substrate artifacts including sub-pixel bleed into paper fibers.

PHASE 3: FORENSIC STEALTH EXECUTION
- RENDER: Output a unified raster image with realistic camera grain.

${request.instructions ? `ADDITIONAL_SPECS: ${request.instructions}` : ""}

OUTPUT: Return only the synthesized image result URL.`;
};

export const processDocument = async (
  baseImageBase64: string | null,
  request: ModificationRequest,
  options: ProcessingOptions
): Promise<{ imageUrl?: string; thinking?: string }> => {
  const prompt = getSynthesisPrompt(request);
  const activeApiKey = getOperationalKey();
  
  try {
    // 1. Create the generation task via Kie.ai Tasking Layer
    const createTaskBody = {
      model: "google/nano-banana",
      input: {
        prompt: prompt,
        output_format: "png",
        image_size: "1:1",
        // The API supports input images via standard base64 strings
        image: baseImageBase64 ? baseImageBase64 : undefined 
      }
    };

    const initResponse = await fetch(`${KIE_BASE_URL}/createTask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${activeApiKey}`
      },
      body: JSON.stringify(createTaskBody)
    });

    const initData = await initResponse.json();
    
    if (initData.code !== 200 || !initData.data?.taskId) {
      throw new Error(initData.msg || "Kie.ai Task Creation Failed");
    }

    const taskId = initData.data.taskId;

    // 2. Poll the status until completion (Waiting -> Success/Fail)
    let attempts = 0;
    const maxAttempts = 30; // Max ~2 minutes polling
    
    while (attempts < maxAttempts) {
      // 4-second delay between checks to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const pollResponse = await fetch(`${KIE_BASE_URL}/recordInfo?taskId=${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${activeApiKey}`
        }
      });

      if (!pollResponse.ok) {
        attempts++;
        continue;
      }

      const pollData = await pollResponse.json();
      
      if (pollData.code === 200 && pollData.data) {
        const state = pollData.data.state;

        if (state === "success") {
          try {
            const resultObj = JSON.parse(pollData.data.resultJson);
            const imageUrl = resultObj.resultUrls?.[0];
            if (imageUrl) return { imageUrl };
          } catch (e) {
            throw new Error("Failed to extract image metadata from resultJson.");
          }
        } else if (state === "fail") {
          throw new Error(pollData.data.failMsg || "Kie.ai Synthesis Protocol Failed");
        }
      }
      
      attempts++;
    }

    return { thinking: `SYNTH_TIMEOUT: Synthesis job exceeded allocation time. TaskID: ${taskId}` };
    
  } catch (err: any) {
    console.error("Kie.ai Connection Failure:", err);
    return { 
      thinking: `CORE_LINK_ERROR: ${err.message || "Failed to establish link with synthesis node."}`
    };
  }
};
