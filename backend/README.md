# Django + Supabase Backend

## Setup

1. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_KEY`: Your Supabase API key

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Server**
   ```bash
   python manage.py runserver
   ```

The server will run on `http://localhost:8000`

## API Endpoints

- `GET /api/health/` - Health check
- `GET /api/seminars/` - List all seminars
- `POST /api/seminars/` - Create a new seminar
- `GET /api/participants/` - List all participants
- `POST /api/participants/` - Create a new participant
- `POST /api/attendance/scan/` - Record attendance

## Database

This backend uses Supabase PostgreSQL as the database. Ensure your Supabase tables have the following structure:

- `seminars` - Table to store seminar information
- `participants` - Table to store participant information
- `attendance` - Table to store attendance records

## Structure

- `backend/` - Django project configuration
- `api/` - Main API app with views and URLs
- `supabase_client.py` - Supabase client configuration
