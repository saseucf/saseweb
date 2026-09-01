-- Fix: Allow admins to view all event attendances
-- This is required for both the initial fetch and for Realtime subscriptions to work on the client.

DROP POLICY IF EXISTS "Admins can view all attendances" ON public.event_attendances;

CREATE POLICY "Admins can view all attendances"
  ON public.event_attendances FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
