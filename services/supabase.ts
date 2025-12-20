
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wuhjmhjcsvunviofeslr.supabase.co";
const supabaseKey = "sb_publishable_pPF-mjm0C_UCgKgIbBVnqQ_yGt3Cm--";

export const supabase = createClient(supabaseUrl, supabaseKey);
