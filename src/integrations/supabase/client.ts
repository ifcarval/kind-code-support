import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

const supabaseUrl =
  'https://fngkbiwceyypdzzvwgsj.supabase.co';

// Use SOMENTE a chave PUBLICÁVEL do projeto acima.
const supabaseKey =
  'sb_publishable_lVrf-VhGrqzxWBA8ahkhLA_bSkGnzwg';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
