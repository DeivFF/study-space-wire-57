import { describe, it, expect, spyOn } from "bun:test";
import { sendFriendRequestForTest, removeFriendForTest, acceptFriendRequestForTest } from "../../src/contexts/FriendsContext";

describe("sendFriendRequestForTest", () => {
  it("warns about existing pending request in either direction", async () => {
    const profileQuery = {
      select: () => ({
        ilike: () => ({
          single: () => Promise.resolve({ data: { user_id: "other" }, error: null }),
        }),
      }),
    } as any;

    const friendRequestsQuery: any = {
      select: () => ({
        or: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { id: "existing" }, error: null }),
          }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
    };
    const insertSpy = spyOn(friendRequestsQuery, "insert").mockResolvedValue({ error: null });

    const supabase = {
      from: (table: string) => {
        if (table === "profiles") return profileQuery;
        return friendRequestsQuery;
      },
    } as any;

    const toastObj = { fn: () => {} };
    const toastSpy = spyOn(toastObj, "fn").mockImplementation(() => {});

    await sendFriendRequestForTest("nick", {
      user: { id: "me" },
      supabase,
      toast: toastObj.fn,
      fetchFriendRequests: async () => {},
    });

    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Convite pendente" })
    );
    expect(insertSpy).not.toHaveBeenCalled();

    insertSpy.mockRestore();
    toastSpy.mockRestore();
  });

  it("sends request regardless of nickname capitalization", async () => {
    const otherId = "other";

    const profileSelect: any = {
      ilike: () => ({
        single: () => Promise.resolve({ data: { user_id: otherId }, error: null }),
      }),
    };
    const ilikeSpy = spyOn(profileSelect, "ilike").mockImplementation((_, __) => ({
      single: () => Promise.resolve({ data: { user_id: otherId }, error: null }),
    }));

    let inserted = false;
    const profileQuery = { select: () => profileSelect } as any;
    const friendRequestsQuery: any = {
      select: () => ({
        or: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
        }),
      }),
      insert: () => {
        inserted = true;
        return Promise.resolve({ error: null });
      },
    };

    const supabase = {
      from: (table: string) => (table === "profiles" ? profileQuery : friendRequestsQuery),
    } as any;

    await sendFriendRequestForTest("NiCk", {
      user: { id: "me" },
      supabase,
      toast: () => {},
      fetchFriendRequests: async () => {},
    });

    expect(ilikeSpy).toHaveBeenCalledWith("nickname", "NiCk");
    expect(inserted).toBe(true);
  });

  for (const [status, title] of [
    ["accepted", "Convite já aceito"],
    ["rejected", "Convite rejeitado anteriormente"],
    ["pending", "Convite pendente"],
  ]) {
    it(`handles unique constraint when existing request is ${status}`, async () => {
      const profileQuery = {
        select: () => ({
          ilike: () => ({
            single: () => Promise.resolve({ data: { user_id: "other" }, error: null }),
          }),
        }),
      } as any;

      const friendRequestsQuery: any = {
        select: (cols: string) => {
          if (cols === "id") {
            return {
              or: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: null, error: null }),
                }),
              }),
            };
          }
          if (cols === "status") {
            return {
              or: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: { status }, error: null }),
              }),
            };
          }
          return {};
        },
        insert: () =>
          Promise.resolve({
            error: {
              code: "23505",
              message:
                'duplicate key value violates unique constraint "friend_requests_pair_unique"',
            },
          }),
      };

      const supabase = {
        from: (table: string) => {
          if (table === "profiles") return profileQuery;
          return friendRequestsQuery;
        },
      } as any;

      const toastObj = { fn: () => {} };
      const toastSpy = spyOn(toastObj, "fn").mockImplementation(() => {});

      await sendFriendRequestForTest("nick", {
        user: { id: "me" },
        supabase,
        toast: toastObj.fn,
        fetchFriendRequests: async () => {},
      });

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title })
      );

      toastSpy.mockRestore();
    });
  }
});

describe("acceptFriendRequestForTest", () => {
  it("accepts request and creates friendship transactionally", async () => {
    const requestId = "r1";
    const userId = "me";
    const otherId = "other";

    const friendRequests = [
      { id: requestId, sender_id: userId, receiver_id: otherId, status: "pending" },
    ];
    const friendships: any[] = [];

    const supabase = {
      rpc: (_fn: string, _params: any) => Promise.resolve({ error: null }),
    } as any;
    const rpcSpy = spyOn(supabase, "rpc").mockImplementation((_fn, params) => {
      const fr = friendRequests.find((f) => f.id === params.p_request_id);
      if (fr) {
        fr.status = "accepted";
        friendships.push({ id: "f1", user1_id: fr.sender_id, user2_id: fr.receiver_id });
      }
      return Promise.resolve({ error: null });
    });

    const toastObj = { fn: () => {} };
    const toastSpy = spyOn(toastObj, "fn").mockImplementation(() => {});

    await acceptFriendRequestForTest(requestId, {
      supabase,
      toast: toastObj.fn,
      fetchFriendRequests: async () => {},
      fetchFriends: async () => {},
    });

    expect(rpcSpy).toHaveBeenCalledWith("accept_friend_request", { p_request_id: requestId });
    expect(friendRequests[0].status).toBe("accepted");
    expect(friendships).toHaveLength(1);
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Convite aceito" })
    );

    rpcSpy.mockRestore();
    toastSpy.mockRestore();
  });
});

describe("removeFriendForTest", () => {
  it("removes friendship and related requests allowing re-invite", async () => {
    const userId = "me";
    const otherId = "other";

    const profileQuery = {
      select: () => ({
        ilike: () => ({
          single: () => Promise.resolve({ data: { user_id: otherId }, error: null }),
        }),
      }),
    } as any;

    let friendRequests: any[] = [
      { id: "r1", sender_id: userId, receiver_id: otherId, status: "accepted" },
    ];
    const friendships: any[] = [
      { id: "f1", user1_id: userId, user2_id: otherId },
    ];

    const friendRequestsQuery: any = {
      select: () => ({
        or: () => ({
          eq: () => ({
            maybeSingle: () => {
              const existing = friendRequests.find(
                (fr) =>
                  ((fr.sender_id === userId && fr.receiver_id === otherId) ||
                    (fr.sender_id === otherId && fr.receiver_id === userId)) &&
                  fr.status === "pending"
              );
              return Promise.resolve({ data: existing || null, error: null });
            },
          }),
        }),
      }),
      insert: (rows: any[]) => {
        const row = rows[0];
        const conflict = friendRequests.find(
          (fr) =>
            (fr.sender_id === row.sender_id && fr.receiver_id === row.receiver_id) ||
            (fr.sender_id === row.receiver_id && fr.receiver_id === row.sender_id)
        );
        if (conflict) {
          return Promise.resolve({
            error: {
              code: "23505",
              message:
                'duplicate key value violates unique constraint "friend_requests_pair_unique"',
            },
          });
        }
        const newRow = {
          id: (friendRequests.length + 1).toString(),
          status: "pending",
          ...row,
        };
        friendRequests.push(newRow);
        return Promise.resolve({ error: null });
      },
      delete: () => ({
        or: (_: string) => {
          friendRequests = friendRequests.filter(
            (fr) =>
              !(
                (fr.sender_id === userId && fr.receiver_id === otherId) ||
                (fr.sender_id === otherId && fr.receiver_id === userId)
              )
          );
          return Promise.resolve({ error: null });
        },
      }),
    };

    const friendshipsQuery: any = {
      select: () => ({
        eq: (_: string, id: string) => ({
          single: () => {
            const row = friendships.find((f) => f.id === id);
            return Promise.resolve({ data: row || null, error: null });
          },
        }),
      }),
      delete: () => ({
        eq: (_: string, id: string) => {
          const idx = friendships.findIndex((f) => f.id === id);
          if (idx !== -1) friendships.splice(idx, 1);
          return Promise.resolve({ error: null });
        },
      }),
    };

    const supabase = {
      from: (table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "friend_requests") return friendRequestsQuery;
        return friendshipsQuery;
      },
    } as any;

    const toastObj = { fn: () => {} };
    const toastSpy = spyOn(toastObj, "fn").mockImplementation(() => {});

    await removeFriendForTest("f1", {
      supabase,
      toast: toastObj.fn,
      fetchFriends: async () => {},
    });

    expect(friendships).toHaveLength(0);
    expect(friendRequests).toHaveLength(0);

    await sendFriendRequestForTest("nick", {
      user: { id: userId },
      supabase,
      toast: toastObj.fn,
      fetchFriendRequests: async () => {},
    });

    expect(friendRequests).toHaveLength(1);
    const toastTitles = toastSpy.mock.calls.map((c) => c[0].title);
    expect(toastTitles).toContain("Amigo removido");
    expect(toastTitles).toContain("Convite enviado");
    expect(toastTitles).not.toContain("Convite pendente");

    toastSpy.mockRestore();
  });
});

