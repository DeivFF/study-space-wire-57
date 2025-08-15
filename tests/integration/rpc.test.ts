import { describe, expect, it, spyOn } from "bun:test";
import { cloneContentRpc } from "../../src/integrations/supabase/rpc";
import { supabase } from "../../src/integrations/supabase/client";

describe("RPC endpoints", () => {
  it("calls clone_content_rpc with correct params", async () => {
    const rpcSpy = spyOn(supabase, "rpc").mockResolvedValue({ data: null, error: null } as any);
    await cloneContentRpc("abc-123");
    expect(rpcSpy).toHaveBeenCalledWith("clone_content_rpc", { p_shared_content_id: "abc-123" });
    rpcSpy.mockRestore();
  });
});
