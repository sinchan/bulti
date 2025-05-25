import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get the base URL for Supabase Edge Functions based on the current environment
 */
export const getEdgeFunctionBaseUrl = () => {
  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocalDev) {
    // Local Supabase development URL
    return `${supabaseUrl}/functions/v1`;
  } else {
    // Production URL - this will use the same domain as your app
    // with the /functions/v1 path
    return "/functions/v1";
  }
};

/**
 * Get the full URL for a specific Supabase Edge Function
 * @param functionName The name of the edge function
 */
export const getEdgeFunctionUrl = (functionName: string) => {
  return `${getEdgeFunctionBaseUrl()}/${functionName}`;
};
