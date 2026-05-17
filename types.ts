
export type WorkstationType = 
  | 'home' 
  | 'editing' 
  | 'selfie' 
  | 'mockup'
  | 'empty-card'
  | 'packaging';

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
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
}

export interface EmptyCardGeneratorState {
  mode: 'physical' | 'digital';
  preservations: {
    holograms: boolean;
    seals: boolean;
    emblems: boolean;
    signatures: boolean;
    textures: boolean;
    securityPatterns: boolean;
    microprint: boolean;
    borders: boolean;
    gradients: boolean;
    embossing: boolean;
  };
  alignment: {
    autoCenter: boolean;
    perspectiveFlattening: boolean;
    edgeNormalization: boolean;
  };
  cleanup: {
    denoiseStrength: number;
    glareRemoval: boolean;
    compressionCleanup: boolean;
    sharpening: boolean;
    textureRestoration: boolean;
  };
  resolution: {
    upscaleFactor: number;
    dpi: number;
    psdSizing: boolean;
  };
  realism: {
    preserveReflections: boolean;
    preserveGlare: boolean;
    preserveWear: boolean;
    preserveBlur: boolean;
    preserveCameraNoise: boolean;
    preserveCompression: boolean;
    maintainEmbossing: boolean;
    preserveHolographicShine: boolean;
    preservePrintTexture: boolean;
    preserveMaterialGrain: boolean;
  };
}

export interface DocumentMockupState {
  environment: 'office-desk' | 'wood-table' | 'marble' | 'leather-pad' | 'clipboard' | 'printer-tray' | 'paper-stack' | 'dark-table' | 'control-desk';
  lighting: 'natural-daylight' | 'office-fluorescent' | 'low-light' | 'soft-shadows' | 'harsh-flash' | 'ambient-desk';
  cameraStyle: 'phone' | 'studio' | 'slight-blur' | 'top-down' | 'slight-slant' | 'handheld' | 'photocopy' | 'scanned';
  realismLevel: number;
  perspectiveIntensity: number;
  shadowIntensity: number;
  depthOfField: number;
  foldAmount: number;
  printRealism: number;
  compressionRealism: number;
}

export interface AccessKey {
  id: string;
  name?: string;
  key: string;
  duration: '30min' | '7day' | '14day' | '30day';
  durationMs: number;
  createdAt: number;
  activatedAt?: number;
  expiresAt?: number;
  revoked: boolean;
  userId?: string;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  keyId: string;
  imageUrl: string;
  timestamp: number;
  prompt: string;
  textReplacements: TextReplacement[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin';
  createdAt: number;
}

export interface AdminStats {
  totalGenerations: number;
  activeKeys: number;
  expiredKeys: number;
}
