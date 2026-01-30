import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpcgxcpjildyoalxvato.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwY2d4Y3BqaWxkeW9hbHh2YXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjkxNDIsImV4cCI6MjA3MzkwNTE0Mn0.nrNrAPKqHLAR5aoQlcvdHX53n1EhEti06j2Z7yracnI';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
