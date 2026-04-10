alter table public.artist_funnel_settings
alter column default_language set default 'tr';

update public.artist_funnel_settings
set default_language = 'tr'
where default_language is distinct from 'tr';
