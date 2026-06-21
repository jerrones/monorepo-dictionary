import { describe, it, expect } from "vitest";
import {
  encodeCursor,
  decodeCursor,
  buildPaginatedResponse,
} from "../utils/pagination.js";

describe("Pagination Utils", () => {
  describe("encodeCursor / decodeCursor", () => {
    it("should encode and decode a cursor correctly", () => {
      const data = { id: 42 };
      const cursor = encodeCursor(data);

      expect(typeof cursor).toBe("string");
      expect(cursor.length).toBeGreaterThan(0);

      const decoded = decodeCursor(cursor);
      expect(decoded).toEqual(data);
    });

    it("should handle complex cursor data", () => {
      const data = { added_at: "2024-05-05T19:28:13.531Z", word: "fire" };
      const cursor = encodeCursor(data);
      const decoded = decodeCursor(cursor);

      expect(decoded).toEqual(data);
    });

    it("should return null for invalid cursor", () => {
      expect(decodeCursor("invalid-base64!!!")).toBeNull();
    });

    it("should return null for empty string cursor", () => {
      expect(decodeCursor("")).toBeNull();
    });
  });

  describe("buildPaginatedResponse", () => {
    it("should build response with hasNext = true when items > limit", () => {
      const items = ["a", "b", "c", "d", "e", "f"];
      const response = buildPaginatedResponse(
        items,
        100,
        5,
        (word) => ({ id: items.indexOf(word) }),
        false
      );

      expect(response.results).toHaveLength(5);
      expect(response.hasNext).toBe(true);
      expect(response.hasPrev).toBe(false);
      expect(response.totalDocs).toBe(100);
      expect(response.next).toBeTruthy();
      expect(response.previous).toBeNull();
    });

    it("should build response with hasNext = false when items <= limit", () => {
      const items = ["a", "b", "c"];
      const response = buildPaginatedResponse(
        items,
        3,
        5,
        (word) => ({ id: items.indexOf(word) }),
        false
      );

      expect(response.results).toHaveLength(3);
      expect(response.hasNext).toBe(false);
      expect(response.next).toBeNull();
    });

    it("should set hasPrev and previous cursor when hasPrevious is true", () => {
      const items = ["d", "e", "f"];
      const response = buildPaginatedResponse(
        items,
        10,
        5,
        (word) => ({ id: items.indexOf(word) }),
        true
      );

      expect(response.hasPrev).toBe(true);
      expect(response.previous).toBeTruthy();
    });

    it("should handle empty results", () => {
      const response = buildPaginatedResponse(
        [],
        0,
        20,
        () => ({ id: 0 }),
        false
      );

      expect(response.results).toHaveLength(0);
      expect(response.totalDocs).toBe(0);
      expect(response.hasNext).toBe(false);
      expect(response.hasPrev).toBe(false);
      expect(response.next).toBeNull();
      expect(response.previous).toBeNull();
    });
  });
});
