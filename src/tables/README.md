# Supabase SQL Schemas

This directory contains SQL files for creating the necessary tables and schemas in Supabase for the application.

## Schema Overview

The application uses two schemas:

1. `next_auth` - Contains tables for NextAuth.js authentication
2. `public` - Contains application-specific tables like projects, sections, and tasks

## How to Create Tables in Supabase

1. Log in to the Supabase dashboard
2. Navigate to the SQL Editor
3. Execute the SQL files in the following order:

   a. `nextauth.sql` - Creates the NextAuth schema and tables
   b. `users.sql` - Adds additional columns and security policies to users table
   c. `projects.sql` - Creates the projects table
   d. `sections.sql` - Creates the sections table
   e. `tasks.sql` - Creates the tasks table

## Table Relationships

```
next_auth.users
  │
  ├── projects (user_id foreign key)
  │    │
  │    └── sections (project_id foreign key)
  │
  └── tasks (user_id foreign key)
       │
       ├── projects (project_id foreign key)
       ├── sections (section_id foreign key)
       └── tasks (original_task_id self-reference for recurring tasks)
```

## Row Level Security (RLS)

All tables have Row Level Security (RLS) policies enabled. This ensures that users can only access their own data. The policies use the `next_auth.uid()` function to identify the current user from the JWT token.

## Notes on Data Migration

If you're migrating from a previous database:

1. Create all the tables first
2. Verify the schema structure
3. Import data ensuring foreign key constraints are respected
4. Test authentication to ensure NextAuth is properly connected

## UUID Generation

All tables use UUIDs for primary keys, generated using the `uuid_generate_v4()` function. Make sure the `uuid-ossp` extension is enabled in your Supabase project.

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
``` 