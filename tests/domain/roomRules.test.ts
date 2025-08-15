import { describe, expect, it } from "bun:test";
import { canJoinRoom, canManageParticipant, Participant, Role } from "../../src/domain/room";

describe("Room Business Rules", () => {
  describe("canJoinRoom", () => {
    it("should return true if capacity is not full", () => {
      expect(canJoinRoom(5, 10)).toBe(true);
    });

    it("should return false if capacity is full", () => {
      expect(canJoinRoom(10, 10)).toBe(false);
    });
  });

  describe("canManageParticipant", () => {
    const owner: Participant = { user_id: 'owner_id', role: 'owner' };
    const admin: Participant = { user_id: 'admin_id', role: 'admin' };
    const member1: Participant = { user_id: 'member1_id', role: 'member' };
    const member2: Participant = { user_id: 'member2_id', role: 'member' };

    // Owner's permissions
    it("owner can promote a member to admin", () => {
      const { canPromote } = canManageParticipant(owner, member1);
      expect(canPromote).toBe(true);
    });

    it("owner can remove a member", () => {
      const { canRemove } = canManageParticipant(owner, member1);
      expect(canRemove).toBe(true);
    });

    it("owner can remove an admin", () => {
      const { canRemove } = canManageParticipant(owner, admin);
      expect(canRemove).toBe(true);
    });

    it("owner cannot promote an admin", () => {
      const { canPromote } = canManageParticipant(owner, admin);
      expect(canPromote).toBe(false);
    });

    // Admin's permissions
    it("admin can remove a member", () => {
      const { canRemove } = canManageParticipant(admin, member1);
      expect(canRemove).toBe(true);
    });

    it("admin cannot remove an owner", () => {
      const { canRemove } = canManageParticipant(admin, owner);
      expect(canRemove).toBe(false);
    });

    it("admin cannot remove another admin", () => {
      const otherAdmin: Participant = { user_id: 'other_admin_id', role: 'admin' };
      const { canRemove } = canManageParticipant(admin, otherAdmin);
      expect(canRemove).toBe(false);
    });

    it("admin cannot promote a member", () => {
      const { canPromote } = canManageParticipant(admin, member1);
      expect(canPromote).toBe(false);
    });

    // Member's permissions
    it("member cannot promote anyone", () => {
      const { canPromote } = canManageParticipant(member1, member2);
      expect(canPromote).toBe(false);
    });

    it("member cannot remove anyone", () => {
      const { canRemove } = canManageParticipant(member1, member2);
      expect(canRemove).toBe(false);
    });
  });
});
