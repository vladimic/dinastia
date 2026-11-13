-- Observação livre sobre o grupo (texto digitado na tela; a importação de PDFs não a altera).
alter table public.grupo add column if not exists observacao text check (observacao is null or char_length(observacao) <= 2000);
comment on column public.grupo.observacao is 'Observação livre digitada pelo usuário sobre o grupo (Dados do grupo, abaixo da sequência de contemplação). Não vem do PDF e a importação não a altera.';
