-- Extend the generic custom-fields system (0006) to every screen that has a
-- "cadastrar" flow, not just Lead/Orçamento: Contrato and Modelo.
-- `campos_customizados` here is deliberately separate from `contracts.campos`
-- (which holds per-template variable substitutions, e.g. {{empresa}}) — this
-- is the same admin-defined classification mechanism used on leads/quotes.

alter type custom_field_entity add value 'contrato';
alter type custom_field_entity add value 'modelo';

alter table contracts add column campos_customizados jsonb not null default '{}'::jsonb;
alter table templates add column campos_customizados jsonb not null default '{}'::jsonb;
