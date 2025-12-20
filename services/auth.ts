
import { AccessKey, HistoryEntry } from '../types';
import { supabase } from './supabase';

export const db = {
  async getKeys(): Promise<AccessKey[]> {
    try {
      const { data, error } = await supabase
        .from('ds_access_keys')
        .select('*');
      
      if (error) {
        console.error("Supabase API Error [getKeys]:", error.message);
        return [];
      }
      
      return (data || []).map(k => ({
        id: k.id,
        key: k.key,
        duration: k.duration,
        durationMs: k.duration_ms,
        createdAt: k.created_at,
        activatedAt: k.activated_at,
        expiresAt: k.expires_at,
        revoked: k.revoked
      }));
    } catch (e) {
      console.error("Network Failure [getKeys]:", e);
      return [];
    }
  },

  async saveKeys(keys: AccessKey[]): Promise<void> {
    try {
      const dbKeys = keys.map(k => ({
        id: k.id,
        key: k.key,
        duration: k.duration,
        duration_ms: k.durationMs,
        created_at: k.createdAt,
        activated_at: k.activatedAt,
        expires_at: k.expiresAt,
        revoked: k.revoked
      }));

      const { error } = await supabase
        .from('ds_access_keys')
        .upsert(dbKeys);
      
      if (error) console.error("Supabase API Error [saveKeys]:", error.message);
    } catch (e) {
      console.error("Network Failure [saveKeys]:", e);
    }
  },

  async getHistory(keyId?: string): Promise<HistoryEntry[]> {
    try {
      let query = supabase.from('ds_history').select('*');
      if (keyId) query = query.eq('key_id', keyId);
      
      const { data, error } = await query;
      if (error) {
        console.error("Supabase API Error [getHistory]:", error.message);
        return [];
      }
      return (data || []).map(h => ({
        id: h.id,
        keyId: h.key_id,
        imageUrl: h.image_url,
        timestamp: h.timestamp,
        prompt: h.prompt,
        textReplacements: h.text_replacements || []
      }));
    } catch (e) {
      console.error("Network Failure [getHistory]:", e);
      return [];
    }
  },

  async saveHistory(entry: HistoryEntry): Promise<void> {
    try {
      const payload = {
        id: entry.id,
        key_id: entry.keyId,
        image_url: entry.imageUrl,
        timestamp: entry.timestamp,
        prompt: entry.prompt,
        text_replacements: entry.textReplacements
      };

      const { error } = await supabase
        .from('ds_history')
        .insert([payload]);
      
      if (error) {
        console.error("Supabase API Error [saveHistory]:", error.message);
        // If you see "column key_id does not exist", the SQL script above was not run successfully.
      }
    } catch (e) {
      console.error("Network Failure [saveHistory]:", e);
    }
  }
};

export const generateKey = async (duration: AccessKey['duration']): Promise<AccessKey | null> => {
  const now = Date.now();
  const durations = {
    '7day': 7 * 24 * 60 * 60 * 1000,
    '14day': 14 * 24 * 60 * 60 * 1000,
    '1month': 30 * 24 * 60 * 60 * 1000,
  };
  
  const newKey: AccessKey = {
    id: Math.random().toString(36).substring(2, 15),
    key: `DS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    duration,
    durationMs: durations[duration],
    createdAt: now,
    revoked: false
  };
  
  try {
    const { error } = await supabase.from('ds_access_keys').insert([{
      id: newKey.id,
      key: newKey.key,
      duration: newKey.duration,
      duration_ms: newKey.durationMs,
      created_at: newKey.createdAt,
      revoked: newKey.revoked
    }]);

    if (error) {
      console.error("Supabase Write Error [generateKey]:", error.message);
      return null;
    }
    return newKey;
  } catch (e) {
    console.error("Fatal Exception [generateKey]:", e);
    return null;
  }
};

export const validateKey = async (keyString: string): Promise<AccessKey | null> => {
  try {
    const { data: keys, error } = await supabase
      .from('ds_access_keys')
      .select('*')
      .eq('key', keyString)
      .eq('revoked', false);

    if (error || !keys || keys.length === 0) return null;
    
    const k = keys[0];
    const key: AccessKey = {
      id: k.id,
      key: k.key,
      duration: k.duration,
      durationMs: k.duration_ms,
      createdAt: k.created_at,
      activatedAt: k.activated_at,
      expiresAt: k.expires_at,
      revoked: k.revoked
    };

    const now = Date.now();

    if (!key.activatedAt) {
      key.activatedAt = now;
      key.expiresAt = now + key.durationMs;
      await supabase
        .from('ds_access_keys')
        .update({ activated_at: key.activatedAt, expires_at: key.expiresAt })
        .eq('id', key.id);
    }

    if (key.expiresAt && now > key.expiresAt) return null;
    return key;
  } catch (e) {
    console.error("Validation Error:", e);
    return null;
  }
};

export const formatTimeRemaining = (expiresAt?: number): string => {
  if (!expiresAt) return "PENDING ACTIVATION";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "SIGNAL TERMINATED";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}D ${hours}H REMAINING`;
  return `${hours}H ${mins}M REMAINING`;
};

export const cleanupExpiredData = async () => {
  try {
    const keys = await db.getKeys();
    const now = Date.now();
    const expiredKeyIds = keys.filter(k => k.expiresAt && k.expiresAt < now).map(k => k.id);
    
    if (expiredKeyIds.length > 0) {
      await supabase.from('ds_history').delete().in('key_id', expiredKeyIds);
    }
  } catch (e) {
    console.error("Cleanup error:", e);
  }
};
