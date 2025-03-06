--
-- Projects table
--
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security on the projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY projects_select_policy ON public.projects
    FOR SELECT
    USING (user_id = next_auth.uid());

CREATE POLICY projects_insert_policy ON public.projects
    FOR INSERT
    WITH CHECK (user_id = next_auth.uid());

CREATE POLICY projects_update_policy ON public.projects
    FOR UPDATE
    USING (user_id = next_auth.uid());

CREATE POLICY projects_delete_policy ON public.projects
    FOR DELETE
    USING (user_id = next_auth.uid());

-- Grant permissions
GRANT ALL ON TABLE public.projects TO postgres;
GRANT ALL ON TABLE public.projects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.projects TO authenticated; 