
/**
 * DOCUSYNTH ENGINE CORE: KEY MANAGEMENT
 * Handles persistence of the Global Operational API Key.
 */
const STORAGE_KEY = 'ds_global_api_key';

export const getOperationalKey = (): string => {
  return localStorage.getItem(STORAGE_KEY) || '';
};

export const setOperationalKey = (key: string): void => {
  localStorage.setItem(STORAGE_KEY, key);
};
