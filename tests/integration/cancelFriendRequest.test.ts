import { describe, it, expect, spyOn } from "bun:test";
import { deleteFriendRequest } from "../../src/contexts/FriendsContext";

describe("deleteFriendRequest", () => {
  it("removes sent request and refreshes state", async () => {
    const friendRequests = [
      { id: "r1", sender_id: "me", receiver_id: "other", status: "pending" },
    ];

    const friendRequestsQuery: any = {
      delete: () => ({
        eq: (_: string, id: string) => {
          const idx = friendRequests.findIndex(fr => fr.id === id);
          if (idx !== -1) friendRequests.splice(idx, 1);
          return Promise.resolve({ error: null });
        },
      }),
    };

    const supabase = {
      from: (table: string) => friendRequestsQuery,
    } as any;

    const toastObj = { fn: () => {} };
    const toastSpy = spyOn(toastObj, "fn").mockImplementation(() => {});

    const fetchObj = { fn: async () => {} };
    const fetchSpy = spyOn(fetchObj, "fn").mockResolvedValue();

    await deleteFriendRequest("r1", "Convite cancelado", {
      supabase,
      toast: toastObj.fn,
      fetchFriendRequests: fetchObj.fn,
    });

    expect(friendRequests).toHaveLength(0);
    expect(fetchSpy).toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ title: "Convite cancelado" }));

    toastSpy.mockRestore();
    fetchSpy.mockRestore();
  });
});
