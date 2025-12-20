
/**
 * DOCUSYNTH KEY_VAULT v1.1
 */
export const API_KEYS: string[] = [
  "AIzaSyCWv03A-i43_NKAPEvAxsb-ZrCXahhMTjY",
  "AIzaSyD8icP4zfB7YWsolZyVPxk_u3SVO8s1H04",
  "AIzaSyDN30GHZQIqNDlYadFj2dD3Bjgy7Js93Qg",
  "AIzaSyADmjcD0TYXBApo0RZBcd6QQdh4LuiXdBQ",
  "AIzaSyD9HxJCAC3x50RxiTzJoRYQsFINyoALuzM",
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
