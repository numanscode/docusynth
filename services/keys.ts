
/**
 * DOCUSYNTH KEY_VAULT v1.3
 * Multi-node signal distribution with randomized entry points.
 */
export const API_KEYS: string[] = [
  "AIzaSyA8BNy5AQVgkWgfCPnX17311L3FBi-klVY",
  "AIzaSyCtDNG7KIzUkx76tYK9KnF50RMzR1SZilc",
  "AIzaSyAocCAiRXRTVJ29Foda7HYYMb-EwLZV60w",
  "AIzaSyAA_LGg2C_KG1DcFYbXBYgD0mfkJz_jHmw",
  "AIzaSyCTsmWXxd_AninJ-Yz_D0k2zUgFfl_xj_U"
];

let currentIndex = Math.floor(Math.random() * API_KEYS.length);

export const getOperationalKey = (index?: number): string => {
  // If specific index requested, return it directly (no side effects)
  if (typeof index === 'number') {
    return API_KEYS[index % API_KEYS.length];
  }

  // Check for environment variables (Vercel/Vite)
  let envKey: string | undefined;
  try {
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      envKey = process.env.API_KEY;
    } else if ((import.meta as any).env?.VITE_API_KEY) {
      envKey = (import.meta as any).env?.VITE_API_KEY;
    }
  } catch (e) {}

  if (envKey) return envKey;
  
  // Standard rotation
  const key = API_KEYS[currentIndex];
  currentIndex = (currentIndex + 1) % API_KEYS.length;
  return key;
};

export const getKeyPoolSize = () => API_KEYS.length;
export const getRandomStartIndex = () => Math.floor(Math.random() * API_KEYS.length);
