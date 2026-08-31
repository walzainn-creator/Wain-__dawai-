-- إصلاح تسجيل الصيدليات من الموقع العام
-- شغّل هذا الكود مرة واحدة في Supabase > SQL Editor.
-- لا تضع service_role key في الموقع.

drop policy if exists "owner insert pharmacy" on public.pharmacies;
drop policy if exists "public register pharmacy" on public.pharmacies;

create policy "public register pharmacy"
on public.pharmacies
for insert
to anon, authenticated
with check (is_active = true);

grant insert on public.pharmacies to anon, authenticated;
