import { describe, it, expect } from "vitest";
import { buildQueryString, sortRows } from "../src/modules/tickets.js";

describe("tickets list query helpers", () => {
  describe("buildQueryString", () => {
    it("includes default sort and limit", () => {
      const qs = buildQueryString({
        q: "",
        status: "all",
        priority: "all",
        assignee: "all",
        sort: "newest",
        page: 1,
      });
      expect(qs).toContain("_sort=createdAt");
      expect(qs).toContain("_order=desc");
      expect(qs).toContain("_limit=500");
    });
    it("adds search and filters when set", () => {
      const qs = buildQueryString({
        q: "login",
        status: "open",
        priority: "high",
        assignee: "3",
        sort: "newest",
        page: 2,
      });
      expect(qs).toContain("q=login");
      expect(qs).toContain("status=open");
      expect(qs).toContain("priority=high");
      expect(qs).toContain("assignedTo=3");
    });
    it("uses status sort order when selected", () => {
      const qs = buildQueryString({
        q: "",
        status: "all",
        priority: "all",
        assignee: "all",
        sort: "status",
        page: 1,
      });
      expect(qs).toContain("_sort=status");
      expect(qs).toContain("_order=asc");
    });
  });

  describe("sortRows", () => {
    it("returns same reference when not sorting by priority", () => {
      const rows = [{ id: 1, priority: "low" }];
      expect(sortRows(rows, "newest")).toBe(rows);
    });
    it("sorts by priority then createdAt", () => {
      const rows = [
        { id: 1, priority: "low", createdAt: "2020-01-01T00:00:00.000Z" },
        { id: 2, priority: "urgent", createdAt: "2019-01-01T00:00:00.000Z" },
        { id: 3, priority: "medium", createdAt: "2021-01-01T00:00:00.000Z" },
      ];
      const out = sortRows(rows, "priority");
      expect(out.map((r) => r.id)).toEqual([2, 3, 1]);
    });
  });
});
