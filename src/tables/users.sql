-- 
-- Users additional fields
-- (Extending the next_auth.users table)
--

-- Add created_at and updated_at columns to next_auth.users if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_schema='next_auth' AND table_name='users' AND column_name='created_at') THEN
        ALTER TABLE next_auth.users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_schema='next_auth' AND table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE next_auth.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END
$$;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION next_auth.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_users_updated_at ON next_auth.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON next_auth.users
FOR EACH ROW
EXECUTE FUNCTION next_auth.update_updated_at_column();

-- Enable Row Level Security on the users table
ALTER TABLE next_auth.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY users_select_policy ON next_auth.users
    FOR SELECT
    USING (id = next_auth.uid() OR EXISTS (
        SELECT 1 FROM next_auth.accounts 
        WHERE "userId" = next_auth.users.id
        AND provider = 'google'
    ));

CREATE POLICY users_insert_policy ON next_auth.users
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY users_update_policy ON next_auth.users
    FOR UPDATE
    USING (id = next_auth.uid());

CREATE POLICY users_delete_policy ON next_auth.users
    FOR DELETE
    USING (id = next_auth.uid()); 