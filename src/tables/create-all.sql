-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Execute the NextAuth schema first
\i nextauth.sql

-- Then add extra fields to users table
\i users.sql

-- Create application tables
\i projects.sql
\i sections.sql
\i tasks.sql
\i user_preferences.sql

-- Verify tables were created successfully
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname IN ('next_auth', 'public') 
  AND tablename IN (
    'users', 'accounts', 'sessions', 'verification_tokens',
    'projects', 'sections', 'tasks', 'user_preferences'
  )
ORDER BY schemaname, tablename; 