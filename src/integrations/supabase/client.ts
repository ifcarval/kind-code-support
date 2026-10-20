import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from './public-config';

const isPublished = typeof window !== 'undefined' && location.hostname === 'salaodefestaapp.lovable.app';

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: isPublished ? localStorage : brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
