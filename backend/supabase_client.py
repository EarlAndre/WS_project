from supabase import create_client, Client
from decouple import config

url = config('SUPABASE_URL', default=None)
key = config('SUPABASE_KEY', default=None)

supabase: Client = None

if url and key and not url.startswith('your_'):
    supabase = create_client(url, key)
