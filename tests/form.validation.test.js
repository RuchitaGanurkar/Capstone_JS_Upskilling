import { describe, it, expect } from "vitest";
import * as form from "../src/modules/form.js";

describe("form validation helpers", () => {
  describe("required", () => {
    it("uses default message when omitted", () => {
      const r = form.required();
      expect(r("")).toBe("This field is required");
    });
    it("uses custom message for null, undefined, and blank", () => {
      const r = form.required("Need this");
      expect(r(null)).toBe("Need this");
      expect(r(undefined)).toBe("Need this");
      expect(r("  ")).toBe("Need this");
    });
    it("returns null for non-empty trimmed value", () => {
      const r = form.required();
      expect(r(" hello ")).toBe(null);
    });
  });

  describe("minLength", () => {
    it("uses default message when too short", () => {
      expect(form.minLength(4)("ab")).toBe("Must be at least 4 characters");
    });
    it("allows custom message pattern", () => {
      const r = form.minLength(4, "too short");
      expect(r("abc")).toBe("too short");
    });
    it("treats null as empty string for length", () => {
      expect(form.minLength(1)(null)).not.toBe(null);
      expect(form.maxLength(0)(null)).toBe(null);
    });
    it("passes at exact length", () => {
      expect(form.minLength(3)("abc")).toBe(null);
    });
  });

  describe("maxLength", () => {
    it("uses default message when too long", () => {
      expect(form.maxLength(1)("ab")).toBe("Must be at most 1 characters");
    });
    it("fails with custom message", () => {
      const r = form.maxLength(2, "nope");
      expect(r("abc")).toBe("nope");
    });
    it("passes within limit", () => {
      expect(form.maxLength(5)("hi")).toBe(null);
    });
  });

  describe("email", () => {
    it("allows empty (optional field pattern)", () => {
      expect(form.email()("")).toBe(null);
      expect(form.email()("   ")).toBe(null);
    });
    it("uses default invalid message", () => {
      expect(form.email()("bad")).toBe("Enter a valid email address");
    });
    it("rejects other invalid patterns", () => {
      expect(form.email()("not-an-email")).not.toBe(null);
      expect(form.email()("a@b")).not.toBe(null);
    });
    it("accepts simple valid email", () => {
      expect(form.email()("a@b.co")).toBe(null);
    });
  });

  describe("oneOf", () => {
    it("passes when value is in list", () => {
      expect(form.oneOf(["a", "b"])("b")).toBe(null);
    });
    it("uses default invalid choice message", () => {
      expect(form.oneOf(["only"])("nope")).toBe("Invalid choice");
    });
    it("uses custom invalid message", () => {
      expect(form.oneOf(["x"], "bad")("y")).toBe("bad");
    });
  });

  describe("validateField", () => {
    it("runs rules in order and stops at first error", () => {
      const rules = [form.required(), form.minLength(5)];
      expect(form.validateField("x", "ab", rules)).not.toBe(null);
      expect(form.validateField("x", "abcde", rules)).toBe(null);
    });
    it("returns null for empty rules", () => {
      expect(form.validateField("x", "anything", [])).toBe(null);
    });
  });

  describe("validateForm", () => {
    it("aggregates per-field errors", () => {
      const schema = {
        a: [form.required()],
        b: [form.minLength(2)],
      };
      const res = form.validateForm(schema, { a: "", b: "x" });
      expect(res.valid).toBe(false);
      expect(res.errors.a).not.toBe(null);
      expect(res.errors.b).not.toBe(null);
    });
    it("marks valid when all pass", () => {
      const schema = {
        a: [form.required()],
        b: [form.email()],
      };
      const res = form.validateForm(schema, { a: "ok", b: "u@example.com" });
      expect(res.valid).toBe(true);
      expect(res.errors.a).toBe(null);
      expect(res.errors.b).toBe(null);
    });
  });
});
