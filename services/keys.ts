
/**
 * DOCUSYNTH ENGINE CORE
 * Mandatory Environment Configuration Required.
 */
export const getOperationalKey = (): string => {
  return process.env.API_KEY || '';
};
