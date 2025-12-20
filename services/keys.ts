
/**
 * DOCUSYNTH KEY_VAULT v1.0
 * Place additional Google Gemini API keys in the array below.
 * The system will automatically rotate between them to prevent rate limiting.
 */
export const API_KEYS: string[] = [
  "AIzaSyCWv03A-i43_NKAPEvAxsb-ZrCXahhMTjY",
  "AIzaSyD8icP4zfB7YWsolZyVPxk_u3SVO8s1H04",
  "AIzaSyDN30GHZQIqNDlYadFj2dD3Bjgy7Js93Qg",
  "AIzaSyADmjcD0TYXBApo0RZBcd6QQdh4LuiXdBQ",
  "AIzaSyD9HxJCAC3x50RxiTzJoRYQsFINyoALuzM",
  "AIzaSyCTsmWXxd_AninJ-Yz_D0k2zUgFfl_xj_U"
];

/**
 * Returns a rotated key or the system default.
 * This logic ensures that even if no additional keys are provided, 
 * the primary operational environment key remains the anchor.
 */
let currentIndex = 0;
export const getOperationalKey = (): string => {
  const envKey = process.env.API_KEY;
  const pool = [...API_KEYS];
  
  // Ensure the environment key is part of the pool if it exists
  if (envKey && !pool.includes(envKey)) {
    pool.unshift(envKey);
  }

  if (pool.length === 0) return "";
  
  const key = pool[currentIndex];
  currentIndex = (currentIndex + 1) % pool.length;
  return key;
};
