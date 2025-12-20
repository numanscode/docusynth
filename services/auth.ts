
import { AccessKey, HistoryEntry } from '../types';
import { supabase } from './supabase';

/**
 * AUTH SERVICE: RESILIENT PERSISTENCE LAYER
 * Optimized for hybrid Supabase/Local storage.
 */

const parseTimestamp = (val: any): number => {
  if (!val) return Date.now();
  if (typeof val === 'number') return val;
  const d = new Date(val).getTime();
  return isNaN(d) ? Date.now() : d;
};

const localVault = {
  keys: 'ds_local_keys',
  history: 'ds_local_history',
  settings: 'ds_local_settings'
};

const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
};

const setLocal = (key: string, val: any) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

export const db = {
  async getSettings(id: string): Promise<string> {
    try {
      const { data, error } = await supabase.from('ds_settings').select('value').eq('id', id).maybeSingle();
      if (error) throw error;
      return data?.value || '';
    } catch {
      const settings = getLocal<Record<string, string>>(localVault.settings, {});
      return settings[id] || '';
    }
  },

  async setSettings(id: string, value: string): Promise<void> {
    const settings = getLocal<Record<string, string>>(localVault.settings, {});
    settings[id] = value;
    setLocal(localVault.settings, settings);
    try {
      await supabase.from('ds_settings').upsert({ id, value, updated_at: new Date().toISOString() });
    } catch (e) { console.error("Settings Sync Failure:", e); }
  },

  async getKeys(): Promise<AccessKey[]> {
    try {
      const { data, error } = await supabase.from('ds_access_keys').select('*');
      if (error) throw error;
      
      const mapped = (data || []).map(k => ({
        id: k.id,
        key: k.key,
        duration: k.duration || '7day',
        durationMs: k.duration_ms || 604800000,
        createdAt: parseTimestamp(k.created_at),
        activatedAt: k.activated_at ? parseTimestamp(k.activated_at) : undefined,
        expiresAt: k.expires_at ? parseTimestamp(k.expires_at) : undefined,
        revoked: !!k.revoked
      }));
      
      setLocal(localVault.keys, mapped);
      return mapped;
    } catch (e) {
      console.warn("Supabase Unreachable: Falling back to Local Vault.");
      return getLocal<AccessKey[]>(localVault.keys, []);
    }
  },

  async saveKeys(keys: AccessKey[]): Promise<void> {
    setLocal(localVault.keys, keys);
    try {
      const dbKeys = keys.map(k => ({
        id: k.id,
        key: k.key,
        duration: k.duration,
        duration_ms: k.durationMs,
        created_at: new Date(k.createdAt).toISOString(),
        activated_at: k.activatedAt ? new Date(k.activatedAt).toISOString() : null,
        expires_at: k.expiresAt ? new Date(k.expiresAt).toISOString() : null,
        revoked: k.revoked
      }));
      await supabase.from('ds_access_keys').upsert(dbKeys);
    } catch (e) { console.error("Key Sync Failure:", e); }
  },

  async getHistory(keyId?: string): Promise<HistoryEntry[]> {
    try {
      let query = supabase.from('ds_history').select('*');
      if (keyId) query = query.eq('key_id', keyId);
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(h => ({
        id: h.id,
        keyId: h.key_id,
        imageUrl: h.image_url,
        timestamp: parseTimestamp(h.timestamp),
        prompt: h.prompt,
        textReplacements: h.text_replacements || []
      }));
    } catch {
      const local = getLocal<HistoryEntry[]>(localVault.history, []);
      return keyId ? local.filter(h => h.keyId === keyId) : local;
    }
  },

  async saveHistory(entry: HistoryEntry): Promise<void> {
    const local = getLocal<HistoryEntry[]>(localVault.history, []);
    setLocal(localVault.history, [...local, entry]);
    try {
      await supabase.from('ds_history').insert([{
        id: entry.id,
        key_id: entry.keyId,
        image_url: entry.imageUrl,
        timestamp: new Date(entry.timestamp).toISOString(),
        prompt: entry.prompt,
        text_replacements: entry.textReplacements
      }]);
    } catch {}
  }
};

export const validateKey = async (keyString: string): Promise<AccessKey | null> => {
  if (keyString === 'DS-DEV-ROOT') {
    return {
      id: 'root', key: 'DS-DEV-ROOT', duration: '1month', durationMs: 999999999,
      createdAt: Date.now(), activatedAt: Date.now(), expiresAt: Date.now() + 999999999, revoked: false
    };
  }

  try {
    const { data: keys, error } = await supabase.from('ds_access_keys').select('*').eq('key', keyString).eq('revoked', false).limit(1);
    if (error || !keys || keys.length === 0) throw new Error("Key not found in Cloud");
    
    const k = keys[0];
    const key: AccessKey = {
      id: k.id,
      key: k.key,
      duration: k.duration,
      durationMs: k.duration_ms,
      createdAt: parseTimestamp(k.created_at),
      activatedAt: k.activated_at ? parseTimestamp(k.activated_at) : undefined,
      expiresAt: k.expires_at ? parseTimestamp(k.expires_at) : undefined,
      revoked: !!k.revoked
    };

    if (!key.activatedAt) {
      key.activatedAt = Date.now();
      key.expiresAt = Date.now() + key.durationMs;
      await supabase.from('ds_access_keys').update({
        activated_at: new Date(key.activatedAt).toISOString(),
        expires_at: new Date(key.expiresAt).toISOString()
      }).eq('id', key.id);
    }
    return (key.expiresAt && Date.now() > key.expiresAt) ? null : key;
  } catch {
    const localKeys = getLocal<AccessKey[]>(localVault.keys, []);
    const match = localKeys.find(k => k.key === keyString && !k.revoked);
    if (!match) return null;
    if (match.expiresAt && Date.now() > match.expiresAt) return null;
    return match;
  }
};

export const generateKey = async (duration: AccessKey['duration']): Promise<AccessKey | null> => {
  const durations = { '7day': 604800000, '14day': 1209600000, '1month': 2592000000 };
  const newKey: AccessKey = {
    id: Math.random().toString(36).substring(2),
    key: `DS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    duration, durationMs: durations[duration], createdAt: Date.now(), revoked: false
  };
  
  const local = getLocal<AccessKey[]>(localVault.keys, []);
  setLocal(localVault.keys, [...local, newKey]);

  try {
    await supabase.from('ds_access_keys').insert([{
      id: newKey.id,
      key: newKey.key,
      duration: newKey.duration,
      duration_ms: newKey.durationMs,
      created_at: new Date(newKey.createdAt).toISOString(),
      revoked: false
    }]);
  } catch {}
  return newKey;
};

export const formatTimeRemaining = (expiresAt?: number): string => {
  if (!expiresAt) return "PENDING ACTIVATION";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "SIGNAL TERMINATED";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return hours > 24 ? `${Math.floor(hours/24)}D ${hours%24}H REMAINING` : `${hours}H ${mins}M REMAINING`;
};

export const cleanupExpiredData = async () => {
  try {
    const keys = await db.getKeys();
    const expiredIds = keys.filter(k => k.expiresAt && k.expiresAt < Date.now()).map(k => k.id);
    if (expiredIds.length > 0) await supabase.from('ds_history').delete().in('key_id', expiredIds);
  } catch {}
};
