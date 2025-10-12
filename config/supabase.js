if (!process.env.SUPABASE_URL || !process.env.SERVICE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = require('@supabase/supabase-js').createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = supabase;