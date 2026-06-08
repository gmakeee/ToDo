-- RPC to increment user XP and recalculate level
create or replace function increment_user_xp(p_user_id uuid, p_xp int)
returns void language plpgsql as $$
declare
  new_xp int;
  new_level int;
begin
  update users set xp = xp + p_xp where id = p_user_id returning xp into new_xp;
  -- Level formula: level = floor(sqrt(xp / 100)) + 1
  new_level := floor(sqrt(new_xp::float / 100)) + 1;
  update users set level = new_level where id = p_user_id;
end;
$$;
