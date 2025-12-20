
/**
 * DOCUSYNTH KEY_VAULT v1.2
 * Optimized for secure environment fallback and automatic rotation.
 */
export const API_KEYS: string[] = [
  "AIzaSyA8BNy5AQVgkWgfCPnX17311L3FBi-klVY",
  "AIzaSyCtDNG7KIzUkx76tYK9KnF50RMzR1SZilc",
  "AIzaSyAocCAiRXRTVJ29Foda7HYYMb-EwLZV60w",
  "AIzaSyAA_LGg2C_KG1DcFYbXBYgD0mfkJz_jHmw",
  "AIzaSyCTsmWXxd_AninJ-Yz_D0k2zUgFfl_xj_U"
];

let currentIndex = 0;

export const getOperationalKey = (index?: number): string => {
  // Safe environment check to prevent ReferenceErrors in browser environments
  let envKey: string | undefined;
  
  try {
    // Attempt to access process.env (Vercel/Node style)
    if (typeof process !== 'undefined' && process.env) {
      envKey = process.env.API_KEY;
    }
  } catch (e) {
    // Fallback if process is strictly locked
  }

  // Fallback for Vite-specific environment injection
  if (!envKey) {
    envKey = (import.meta as any).env?.VITE_API_KEY;
  }
  
  // If an explicit index is requested (for rotation), use the pool
  if (typeof index === 'number') {
    return API_KEYS[index % API_KEYS.length];
  }

  // Initial call preference: prioritize system environment variable
  if (envKey) return envKey;
  
  // Fallback to internal pool
  const key = API_KEYS[currentIndex];
  currentIndex = (currentIndex + 1) % API_KEYS.length;
  return key;
};

export const getKeyPoolSize = () => API_KEYS.length;
