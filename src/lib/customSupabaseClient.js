import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mirznibtnlxnqionjmlz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcnpuaWJ0bmx4bnFpb25qbWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDM4ODMsImV4cCI6MjA4NTMxOTg4M30.LJTmDV0kw60KeIOrY6rWZjUAaerXHjQQVSSwBE9bpus';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
