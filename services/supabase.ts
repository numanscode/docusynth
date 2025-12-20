
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const supabaseUrl = "https://wuhjmhjcsvunviofeslr.supabase.co";
const supabaseKey = "sb_publishable_pPF-mjm0C_UCgKgIbBVnqQ_yGt3Cm--";

export const supabase = createClient(supabaseUrl, supabaseKey);
