
/**
 * DOCUSYNTH KEY_VAULT v1.1
 */
export const API_KEYS: string[] = [
  "AIzaSyA8BNy5AQVgkWgfCPnX17311L3FBi-klVY",
  "AIzaSyCtDNG7KIzUkx76tYK9KnF50RMzR1SZilc",
  "AIzaSyAocCAiRXRTVJ29Foda7HYYMb-EwLZV60w",
  "AIzaSyAA_LGg2C_KG1DcFYbXBYgD0mfkJz_jHmw",
  "AIzaSyCTsmWXxd_AninJ-Yz_D0k2zUgFfl_xj_U"
];

let currentIndex = 0;
export const getOperationalKey = (): string => {
  // Try environment key first (standard Vercel config)
  const envKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;
  if (envKey && currentIndex === 0) return envKey;

  const pool = [...API_KEYS];
  if (pool.length === 0) return envKey || "";
  
  const key = pool[currentIndex];
  currentIndex = (currentIndex + 1) % pool.length;
  return key;
};
