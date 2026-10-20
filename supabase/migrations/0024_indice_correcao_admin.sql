-- Dinastia · 0024: indice_correcao ficou de fora da 0023; passa a seguir a mesma regra (todos leem, só administrador grava).
-- Sem DROP: "autorizado_tudo" é renomeada e restringida (o console da aplicação trava em DROP).
alter policy "autorizado_tudo" on public.indice_correcao rename to "admin_tudo";
alter policy "admin_tudo" on public.indice_correcao using ((select public.eh_admin())) with check ((select public.eh_admin()));
create policy "autorizado_ler" on public.indice_correcao for select to authenticated using ((select public.autorizado()));
