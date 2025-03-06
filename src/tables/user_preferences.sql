-- 
-- User Preferences Table
-- Stores user-specific settings like form of address, phone number, and notification preferences
--

-- Create the user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    form_of_address VARCHAR(50), -- Pronome de tratamento (Sr., Sra., Dr., etc.)
    phone_number VARCHAR(20),    -- Número de telefone celular
    allow_notifications BOOLEAN DEFAULT FALSE, -- Autorização para notificações
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Create a function to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the 'updated_at' column
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for better documentation
COMMENT ON TABLE public.user_preferences IS 'Stores user preferences like form of address, phone number, and notification settings';
COMMENT ON COLUMN public.user_preferences.form_of_address IS 'Form of address (pronome de tratamento) like Sr., Sra., Dr., etc.';
COMMENT ON COLUMN public.user_preferences.phone_number IS 'User''s mobile phone number for notifications';
COMMENT ON COLUMN public.user_preferences.allow_notifications IS 'Whether the user allows notifications to be sent to their phone';

-- Default is no RLS as requested, but adding the SQL for reference
-- (commented out as per requirements to not use RLS)

/*
-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY user_preferences_select_policy ON public.user_preferences
    FOR SELECT
    USING (user_id = next_auth.uid());

CREATE POLICY user_preferences_insert_policy ON public.user_preferences
    FOR INSERT
    WITH CHECK (user_id = next_auth.uid());

CREATE POLICY user_preferences_update_policy ON public.user_preferences
    FOR UPDATE
    USING (user_id = next_auth.uid());

CREATE POLICY user_preferences_delete_policy ON public.user_preferences
    FOR DELETE
    USING (user_id = next_auth.uid());
*/ 