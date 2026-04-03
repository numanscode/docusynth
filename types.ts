
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

export interface AccessKey {
  id: string;
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
