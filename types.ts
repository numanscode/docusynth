
export interface ProcessingOptions {
  forensicStealth: boolean;
  metadataStripping: boolean;
}

export interface TextReplacement {
  key: string;
  value: string;
}

export interface ModificationRequest {
  textReplacements: TextReplacement[];
  instructions: string;
  thinkingMode: boolean;
}

export interface AccessKey {
  id: string;
  key: string;
  duration: '7day' | '14day' | '1month';
  durationMs: number;
  createdAt: number;
  activatedAt?: number;
  expiresAt?: number;
  revoked: boolean;
}

export interface HistoryEntry {
  id: string;
  keyId: string;
  imageUrl: string;
  timestamp: number;
  prompt: string;
  textReplacements: TextReplacement[];
}

export interface AdminStats {
  totalGenerations: number;
  activeKeys: number;
  expiredKeys: number;
}

// Added explicit AIStudio interface to match the environment's expected type structure
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

/**
 * AI Studio Key Selection API Augmentation
 */
declare global {
  interface Window {
    // Corrected to use the named AIStudio type and optional modifier to avoid modifier and type conflicts
    aistudio?: AIStudio;
  }
}
