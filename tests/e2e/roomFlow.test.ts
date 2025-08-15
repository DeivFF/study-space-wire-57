import { describe, expect, it } from "bun:test";
import { canJoinRoom } from "../../src/domain/room";

describe("room flow", () => {
  it("handles participant limits", () => {
    const capacity = 2;
    let participants = 0;

    // first participant
    expect(canJoinRoom(participants, capacity)).toBe(true);
    participants++;

    // second participant
    expect(canJoinRoom(participants, capacity)).toBe(true);
    participants++;

    // third should fail
    expect(canJoinRoom(participants, capacity)).toBe(false);
  });
});
