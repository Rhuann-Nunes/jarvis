--
-- Tasks table
--
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    recurrence_type TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
    recurrence_interval INTEGER,
    recurrence_days_of_week INTEGER[], -- JSON array of days (0-6)
    is_recurrence_occurrence BOOLEAN NOT NULL DEFAULT false,
    original_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_section_id_idx ON public.tasks(section_id);
CREATE INDEX IF NOT EXISTS tasks_original_task_id_idx ON public.tasks(original_task_id);
CREATE INDEX IF NOT EXISTS tasks_completed_idx ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks(due_date);

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update completed_at when a task is completed
CREATE OR REPLACE FUNCTION public.update_completed_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
        NEW.completed_at = NOW();
    ELSIF NEW.completed = FALSE AND OLD.completed = TRUE THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_completed_at ON public.tasks;
CREATE TRIGGER update_tasks_completed_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
WHEN (NEW.completed IS DISTINCT FROM OLD.completed)
EXECUTE FUNCTION public.update_completed_at_column();

-- Enable Row Level Security on the tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
CREATE POLICY tasks_select_policy ON public.tasks
    FOR SELECT
    USING (user_id = next_auth.uid());

CREATE POLICY tasks_insert_policy ON public.tasks
    FOR INSERT
    WITH CHECK (user_id = next_auth.uid());

CREATE POLICY tasks_update_policy ON public.tasks
    FOR UPDATE
    USING (user_id = next_auth.uid());

CREATE POLICY tasks_delete_policy ON public.tasks
    FOR DELETE
    USING (user_id = next_auth.uid());

-- Grant permissions
GRANT ALL ON TABLE public.tasks TO postgres;
GRANT ALL ON TABLE public.tasks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO authenticated; 