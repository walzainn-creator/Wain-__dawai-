-- Optional starter data. Review before running in production.
insert into public.drugs (name_ar, scientific_name, aliases, category)
select 'باراسيتامول','Paracetamol',array['بنادول','باندول','paracetamol','panadol'],'مسكن وخافض حرارة'
where not exists (select 1 from public.drugs where lower(name_ar)=lower('باراسيتامول'));

insert into public.drugs (name_ar, scientific_name, aliases, category)
select 'أموكسيسيلين','Amoxicillin',array['اموكسسلين','اموكسيسيلين','amoxicillin'],'مضاد حيوي'
where not exists (select 1 from public.drugs where lower(name_ar)=lower('أموكسيسيلين'));

insert into public.drugs (name_ar, scientific_name, aliases, category)
select 'إنسولين','Insulin',array['انسولين','insulin'],'السكري'
where not exists (select 1 from public.drugs where lower(name_ar)=lower('إنسولين'));
