-- ==========================================
-- ADD ADMIN LOGS AUDITING
-- ==========================================

-- 1. Create the admin_logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,       -- 'create', 'update', 'delete', 'update_role'
    entity_type TEXT NOT NULL,  -- 'profiles', 'events', 'forms'
    entity_id TEXT,             -- ID of the affected row
    details JSONB,              -- Context (e.g., old vs new values, or specific titles)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Add RLS Policies so only admins can view the logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view logs" ON public.admin_logs FOR SELECT USING (public.is_admin());

-- 3. Create the generic trigger function
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER AS $$
DECLARE
    actor UUID := auth.uid();
    action_name TEXT;
    target_entity_type TEXT := TG_TABLE_NAME;
    target_entity_id TEXT;
    log_details JSONB := '{}'::jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN
        action_name := 'create';
        target_entity_id := NEW.id::TEXT;
        
        -- Extract helpful titles if available
        IF target_entity_type = 'events' OR target_entity_type = 'forms' THEN
            log_details := jsonb_build_object('title', NEW.title);
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        action_name := 'update';
        target_entity_id := NEW.id::TEXT;
        
        IF target_entity_type = 'profiles' THEN
            -- Only log role changes for profiles
            IF OLD.role = NEW.role THEN
                RETURN NEW; -- Don't log if role didn't change
            END IF;
            action_name := 'update_role';
            log_details := jsonb_build_object(
                'old_role', OLD.role, 
                'new_role', NEW.role, 
                'user_name', NEW.first_name || ' ' || NEW.last_name,
                'email', NEW.email
            );
        ELSIF target_entity_type = 'events' OR target_entity_type = 'forms' THEN
            log_details := jsonb_build_object('title', NEW.title);
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        action_name := 'delete';
        target_entity_id := OLD.id::TEXT;
        
        IF target_entity_type = 'events' OR target_entity_type = 'forms' THEN
            log_details := jsonb_build_object('title', OLD.title);
        END IF;
    END IF;

    -- Only log if we have an actor (a user is logged in and doing the action via the app)
    IF actor IS NOT NULL THEN
        INSERT INTO public.admin_logs (actor_id, action, entity_type, entity_id, details)
        VALUES (actor, action_name, target_entity_type, target_entity_id, log_details);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach triggers to tables
DROP TRIGGER IF EXISTS log_events_changes ON public.events;
CREATE TRIGGER log_events_changes 
    AFTER INSERT OR UPDATE OR DELETE ON public.events 
    FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

DROP TRIGGER IF EXISTS log_forms_changes ON public.forms;
CREATE TRIGGER log_forms_changes 
    AFTER INSERT OR UPDATE OR DELETE ON public.forms 
    FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

DROP TRIGGER IF EXISTS log_profiles_changes ON public.profiles;
CREATE TRIGGER log_profiles_changes 
    AFTER UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();
