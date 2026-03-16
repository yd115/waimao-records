-- One-off account cleanup script
-- Purpose:
-- 1. Ensure 18914955792@189.cn is an admin
-- 2. Remove the old yuyu@miaoda.com account if it still exists
-- 3. Verify the final account state

begin;

-- Promote the new account to admin.
update public.profiles
set role = 'admin'::public.user_role
where id = (
  select id
  from auth.users
  where email = '18914955792@189.cn'
);

-- Delete the old account if it still exists.
delete from auth.users
where email = 'yuyu@miaoda.com';

commit;

-- Final verification: only the new account should remain.
select
  u.email,
  p.role,
  (
    select count(*)
    from public.records r
    where r.user_id = p.id
  ) as record_count,
  (
    select count(*)
    from public.tags t
    where t.user_id = p.id
  ) as tag_count
from public.profiles p
join auth.users u on u.id = p.id
where u.email in ('yuyu@miaoda.com', '18914955792@189.cn');
