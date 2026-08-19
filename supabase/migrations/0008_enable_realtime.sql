-- Central de Atendimento needs to reflect inbound WhatsApp messages (and
-- takeover/mode changes) without a manual page reload. Add the two tables
-- the UI listens on to the default realtime publication.
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
