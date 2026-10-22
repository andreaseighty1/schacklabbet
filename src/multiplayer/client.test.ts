import { describe, expect, it } from "vitest";
import { FriendError, friendMessage, normalizeCode } from "./client";
describe("elevens kompisparti", () => {
  it("tar emot både uppläst och kopierad kod", () => {
    expect(normalizeCode(" abcde-fgh23 \n")).toBe("ABCDEFGH23");
  });
  it("förklarar delat skolnätverk, egen kod och gamla drag på svenska", () => {
    expect(friendMessage(new FriendError("signup_limit"))).toContain("lärare");
    expect(friendMessage(new FriendError("own_room"))).toContain("sin dator");
    expect(friendMessage(new FriendError("conflict"))).toContain(
      "nya ställningen",
    );
    expect(friendMessage(new Error("private error"))).not.toContain(
      "private error",
    );
  });
});
