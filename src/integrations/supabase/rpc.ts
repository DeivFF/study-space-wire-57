import { supabase } from "./client";

export function cloneContentRpc(sharedContentId: string) {
  return supabase.rpc("clone_content_rpc", {
    p_shared_content_id: sharedContentId,
  });
}
