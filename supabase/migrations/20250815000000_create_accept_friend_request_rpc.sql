-- RPC to accept a friend request and create friendship transactionally
create or replace function public.accept_friend_request(p_request_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  fr record;
begin
  select sender_id, receiver_id into fr
  from public.friend_requests
  where id = p_request_id and status = 'pending'
  for update;

  if not found then
    raise exception 'Friend request not found';
  end if;

  update public.friend_requests
    set status = 'accepted'
    where id = p_request_id;

  insert into public.friendships (user1_id, user2_id)
    values (fr.sender_id, fr.receiver_id);
end;
$$;
