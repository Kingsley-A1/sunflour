import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password hashing", () => {
  it(
    "hashes and verifies passwords without exposing the plain value",
    async () => {
      const password = "Sunflour123";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      await expect(verifyPassword(password, hash)).resolves.toBe(true);
      await expect(verifyPassword("Wrong123", hash)).resolves.toBe(false);
    },
    30_000,
  );
});
