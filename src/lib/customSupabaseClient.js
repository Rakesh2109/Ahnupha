import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rritvztvwtikrrqphjlq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyaXR2enR2d3Rpa3JycXBoamxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODU3NTYsImV4cCI6MjA4NDU2MTc1Nn0.0Yq_VLJEpPEk2gxdjvoUJLPN01KA6MDRV8qC36uqk-Y';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
