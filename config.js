// =====================================================
// CONFIGURACIÓN DE SUPABASE (compartida)
// =====================================================
const SUPABASE_URL = 'https://ecruxlrjzatkbrpgdcaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcnV4bHJqemF0a2JycGdkY2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDg0NzYsImV4cCI6MjA4NTE4NDQ3Nn0.X59-l7JQyFRTosmQmet8tLkviXyQCov5mJY6dftyrf0';
let db = null;

try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.error('Error inicializando Supabase:', e);
}
