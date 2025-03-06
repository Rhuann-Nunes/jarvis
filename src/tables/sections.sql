--
-- Sections table
--
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on project_id for better query performance
CREATE INDEX IF NOT EXISTS sections_project_id_idx ON public.sections(project_id);

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_sections_updated_at ON public.sections;
CREATE TRIGGER update_sections_updated_at
BEFORE UPDATE ON public.sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security on the sections table
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sections
CREATE POLICY sections_select_policy ON public.sections
    FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = next_auth.uid()
        )
    );

CREATE POLICY sections_insert_policy ON public.sections
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = next_auth.uid()
        )
    );

CREATE POLICY sections_update_policy ON public.sections
    FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = next_auth.uid()
        )
    );

CREATE POLICY sections_delete_policy ON public.sections
    FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE user_id = next_auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON TABLE public.sections TO postgres;
GRANT ALL ON TABLE public.sections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sections TO authenticated; 